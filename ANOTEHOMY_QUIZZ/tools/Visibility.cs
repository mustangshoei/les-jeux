// ==========================================================================
// Visibility.cs - vues ou chaque muscle est le mieux visible
// --------------------------------------------------------------------------
// Rendu orthographique "par identifiant" (tampon de profondeur logiciel) de
// tous les maillages (muscles et squelette) depuis 4 directions : anterieure
// (A), posterieure (P), laterale droite (LD) et laterale gauche (LG). Pour
// chaque partie cliquable : pixels visibles dans chaque vue, compares a sa
// silhouette seule, et profondeur moyenne sous la surface visible. Resultat
// range dans Part.Label : "vues;pourcentage", ex. "P LG;64" = mieux visible
// de dos puis de gauche, 64 % visible au mieux. Muscle profond (presque
// invisible) : la vue d'ou il est le moins profond.
// C# 5 (compilateur de Windows PowerShell 5.1 via Add-Type).
// ==========================================================================
using System;
using System.Collections.Generic;
using System.Globalization;

public static class Visibility
{
    static readonly string[] Names = { "A", "P", "LD", "LG" };

    // coordonnees ecran (u, v) et profondeur w (grande = proche de l'observateur) ;
    // repere : x = gauche du sujet, y = haut, z = anterieur
    static void Project(int view, double x, double y, double z, out double u, out double v, out double w)
    {
        v = y;
        switch (view)
        {
            case 0: u = x; w = z; break;       // anterieure : observateur en +z
            case 1: u = -x; w = -z; break;     // posterieure : observateur en -z
            case 2: u = -z; w = -x; break;     // laterale droite : observateur en -x
            default: u = z; w = x; break;      // laterale gauche : observateur en +x
        }
    }

    // cell : taille d'un pixel (mm) ; minPx : en dessous, la partie est "profonde"
    public static string Annotate(IList<Part> parts, double cell, int minPx)
    {
        int n = parts.Count;
        var visible = new long[n, 4];
        var alone = new long[n, 4];
        var gap = new double[n, 4];      // profondeur moyenne sous la surface (mm)
        for (int view = 0; view < 4; view++)
        {
            // bornes de la vue
            double uMin = double.MaxValue, uMax = double.MinValue, vMin = double.MaxValue, vMax = double.MinValue;
            foreach (var p in parts)
            {
                var P = p.Mesh.P;
                for (int i = 0; i < P.Count; i += 3)
                {
                    double u, v, w;
                    Project(view, P[i], P[i + 1], P[i + 2], out u, out v, out w);
                    if (u < uMin) uMin = u; if (u > uMax) uMax = u;
                    if (v < vMin) vMin = v; if (v > vMax) vMax = v;
                }
            }
            int W = (int)Math.Ceiling((uMax - uMin) / cell) + 2, H = (int)Math.Ceiling((vMax - vMin) / cell) + 2;
            var depth = new double[W * H];
            var owner = new int[W * H];
            var stamp = new int[W * H];
            var front = new double[W * H];           // face avant de la partie en cours
            for (int i = 0; i < depth.Length; i++) { depth[i] = double.NegativeInfinity; owner[i] = -1; }
            var cover = new List<int>[n];            // pixels couverts par chaque partie
            var coverD = new List<double>[n];        // et profondeur de sa face avant

            for (int pi = 0; pi < n; pi++)
            {
                var m = parts[pi].Mesh;
                bool click = parts[pi].Kind == "b";
                int id = click ? pi : -2;                  // -2 : decor (cache les muscles)
                int vc = m.VertexCount;
                var pu = new double[vc]; var pv = new double[vc]; var pw = new double[vc];
                for (int i = 0; i < vc; i++)
                {
                    double u, v, w;
                    Project(view, m.P[3 * i], m.P[3 * i + 1], m.P[3 * i + 2], out u, out v, out w);
                    pu[i] = (u - uMin) / cell; pv[i] = (v - vMin) / cell; pw[i] = w;
                }
                long own = 0;
                var mine = click ? new List<int>() : null;
                for (int t = 0; t + 2 < m.T.Count; t += 3)
                {
                    int a = m.T[t], b = m.T[t + 1], c = m.T[t + 2];
                    double ax = pu[a], ay = pv[a], bx = pu[b], by = pv[b], cx = pu[c], cy = pv[c];
                    double area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
                    if (Math.Abs(area) < 1e-12) continue;  // triangle vu par la tranche
                    int i0 = Math.Max(0, (int)Math.Floor(Math.Min(ax, Math.Min(bx, cx))));
                    int i1 = Math.Min(W - 1, (int)Math.Ceiling(Math.Max(ax, Math.Max(bx, cx))));
                    int j0 = Math.Max(0, (int)Math.Floor(Math.Min(ay, Math.Min(by, cy))));
                    int j1 = Math.Min(H - 1, (int)Math.Ceiling(Math.Max(ay, Math.Max(by, cy))));
                    for (int j = j0; j <= j1; j++)
                    {
                        double py = j + 0.5;
                        for (int i = i0; i <= i1; i++)
                        {
                            double px = i + 0.5;
                            double w0 = ((bx - px) * (cy - py) - (by - py) * (cx - px)) / area;
                            if (w0 < 0) continue;
                            double w1 = ((cx - px) * (ay - py) - (cy - py) * (ax - px)) / area;
                            if (w1 < 0 || w0 + w1 > 1) continue;
                            double d = w0 * pw[a] + w1 * pw[b] + (1 - w0 - w1) * pw[c];
                            int idx = j * W + i;
                            if (click)
                            {
                                if (stamp[idx] != pi + 1) { stamp[idx] = pi + 1; own++; front[idx] = d; mine.Add(idx); }
                                else if (d > front[idx]) front[idx] = d;
                            }
                            if (d > depth[idx]) { depth[idx] = d; owner[idx] = id; }
                        }
                    }
                }
                if (click)
                {
                    alone[pi, view] = own;
                    cover[pi] = mine;
                    var fd = new List<double>(mine.Count);
                    foreach (int idx in mine) fd.Add(front[idx]);
                    coverD[pi] = fd;
                }
            }
            for (int i = 0; i < owner.Length; i++) if (owner[i] >= 0) visible[owner[i], view]++;
            for (int pi = 0; pi < n; pi++)
            {
                if (cover[pi] == null || cover[pi].Count == 0) { gap[pi, view] = double.MaxValue; continue; }
                double s = 0;
                for (int k = 0; k < cover[pi].Count; k++) s += depth[cover[pi][k]] - coverD[pi][k];
                gap[pi, view] = s / cover[pi].Count;
            }
        }

        // vues retenues : celles ou la partie est au moins moitie aussi visible que dans
        // la meilleure ; partie profonde : la vue d'ou elle est le moins profonde
        int deep = 0;
        for (int pi = 0; pi < n; pi++)
        {
            if (parts[pi].Kind != "b") continue;
            var order = new List<int> { 0, 1, 2, 3 };
            int cur = pi;
            order.Sort((x, y) => visible[cur, y] != visible[cur, x] ? visible[cur, y].CompareTo(visible[cur, x]) : alone[cur, y].CompareTo(alone[cur, x]));
            long best = visible[pi, order[0]];
            double frac = 0;
            for (int v = 0; v < 4; v++) if (alone[pi, v] > 0) frac = Math.Max(frac, visible[pi, v] / (double)alone[pi, v]);
            var views = new List<string>();
            if (best >= minPx) { foreach (int v in order) if (visible[pi, v] * 2 >= best) views.Add(Names[v]); }
            else
            {
                int near = 0;
                for (int v = 1; v < 4; v++) if (gap[pi, v] < gap[pi, near]) near = v;
                views.Add(Names[near]);
                deep++;
            }
            parts[pi].Label = string.Join(" ", views) + ";" + Math.Round(frac * 100).ToString(CultureInfo.InvariantCulture);
        }
        return deep + " parties profondes";
    }
}
