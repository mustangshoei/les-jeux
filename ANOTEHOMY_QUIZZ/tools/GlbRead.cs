// ==========================================================================
// GlbRead.cs - lecture des modeles glTF binaires (.glb) du Human Reference
// Atlas (HuBMAP, organes de reference de la femme) et outils de placement
// --------------------------------------------------------------------------
//  - GlbScene : arbre des noeuds (transformations "matrix" ou TRS), maillages
//    en triangles dans le repere global du fichier, positions multipliees par
//    "unit" (metres -> millimetres : 1000) ;
//  - Shape : boites englobantes, recalage d'une boite sur une autre, et
//    formes generees (tube le long d'un trajet, ellipsoide oriente) pour les
//    organes absents des modeles.
// C# 5 (compilateur de Windows PowerShell 5.1 via Add-Type, avec
// System.Web.Extensions pour le JSON).
// ==========================================================================
using System;
using System.IO;
using System.Collections.Generic;
using System.Text;
using System.Web.Script.Serialization;

public class GlbNode
{
    public string Name;
    public int Mesh = -1;
    public GlbNode Parent;
    public double[] Local = Mat.Identity();
    public double[] World() { return Parent == null ? Local : Mat.Mul(Parent.World(), Local); }
}

public class GlbScene
{
    public List<GlbNode> Nodes = new List<GlbNode>();
    public Dictionary<string, GlbNode> ByName = new Dictionary<string, GlbNode>();
    Dictionary<string, object> js;
    byte[] bin;
    double unit;

    static double D(object o) { return Convert.ToDouble(o, System.Globalization.CultureInfo.InvariantCulture); }
    static int I(object o) { return Convert.ToInt32(o, System.Globalization.CultureInfo.InvariantCulture); }
    static object[] A(Dictionary<string, object> d, string k) { object o; return d.TryGetValue(k, out o) ? (object[])o : new object[0]; }
    static Dictionary<string, object> O(object o) { return (Dictionary<string, object>)o; }

    public static GlbScene Load(string path, double unit)
    {
        var s = new GlbScene { unit = unit };
        var all = File.ReadAllBytes(path);
        if (BitConverter.ToUInt32(all, 0) != 0x46546C67) throw new Exception("Pas un fichier GLB : " + path);
        int off = 12;
        while (off + 8 <= all.Length)
        {
            int len = BitConverter.ToInt32(all, off); uint type = BitConverter.ToUInt32(all, off + 4);
            if (type == 0x4E4F534A)
            {
                var ser = new JavaScriptSerializer { MaxJsonLength = int.MaxValue, RecursionLimit = 1000 };
                s.js = (Dictionary<string, object>)ser.DeserializeObject(Encoding.UTF8.GetString(all, off + 8, len));
            }
            else if (type == 0x004E4942) { s.bin = new byte[len]; Buffer.BlockCopy(all, off + 8, s.bin, 0, len); }
            off += 8 + len;
        }
        var nodes = A(s.js, "nodes");
        foreach (var o in nodes)
        {
            var d = O(o);
            var n = new GlbNode();
            object v;
            n.Name = d.TryGetValue("name", out v) ? (string)v : "";
            if (d.TryGetValue("mesh", out v)) n.Mesh = I(v);
            if (d.TryGetValue("matrix", out v))
            {
                var m = (object[])v; var r = new double[16];
                for (int i = 0; i < 16; i++) r[i] = D(m[i]);    // meme convention que Mat : colonnes, vecteurs colonnes
                n.Local = r;
            }
            else
            {
                double[] t = { 0, 0, 0 }, q = { 0, 0, 0, 1 }, sc = { 1, 1, 1 };
                if (d.TryGetValue("translation", out v)) { var a = (object[])v; for (int i = 0; i < 3; i++) t[i] = D(a[i]); }
                if (d.TryGetValue("rotation", out v)) { var a = (object[])v; for (int i = 0; i < 4; i++) q[i] = D(a[i]); }
                if (d.TryGetValue("scale", out v)) { var a = (object[])v; for (int i = 0; i < 3; i++) sc[i] = D(a[i]); }
                n.Local = Mat.Mul(Mat.Translate(t[0], t[1], t[2]), Mat.Mul(Quat(q), Mat.Scale(sc[0], sc[1], sc[2])));
            }
            s.Nodes.Add(n);
            if (!s.ByName.ContainsKey(n.Name)) s.ByName[n.Name] = n;
        }
        for (int i = 0; i < nodes.Length; i++)
            foreach (var c in A(O(nodes[i]), "children")) s.Nodes[I(c)].Parent = s.Nodes[i];
        return s;
    }

    // rotation d'un quaternion (x, y, z, w), en colonnes comme Mat
    static double[] Quat(double[] q)
    {
        double x = q[0], y = q[1], z = q[2], w = q[3];
        return new double[] {
            1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w), 0,
            2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w), 0,
            2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y), 0,
            0, 0, 0, 1 };
    }

    double[] Floats(int accessor, out int count, out int comps)
    {
        var a = O(A(js, "accessors")[accessor]);
        count = I(a["count"]);
        string type = (string)a["type"];
        comps = type == "SCALAR" ? 1 : type == "VEC2" ? 2 : type == "VEC3" ? 3 : 4;
        int ct = I(a["componentType"]);
        var bv = O(A(js, "bufferViews")[I(a["bufferView"])]);
        object v;
        int start = (bv.TryGetValue("byteOffset", out v) ? I(v) : 0) + (a.TryGetValue("byteOffset", out v) ? I(v) : 0);
        int size = ct == 5126 || ct == 5125 ? 4 : ct == 5123 || ct == 5122 ? 2 : 1;
        int stride = bv.TryGetValue("byteStride", out v) ? I(v) : size * comps;
        var r = new double[count * comps];
        for (int i = 0; i < count; i++)
            for (int k = 0; k < comps; k++)
            {
                int p = start + i * stride + k * size;
                double val;
                switch (ct)
                {
                    case 5126: val = BitConverter.ToSingle(bin, p); break;
                    case 5125: val = BitConverter.ToUInt32(bin, p); break;
                    case 5123: val = BitConverter.ToUInt16(bin, p); break;
                    case 5122: val = BitConverter.ToInt16(bin, p); break;
                    case 5121: val = bin[p]; break;
                    default: val = (sbyte)bin[p]; break;
                }
                r[i * comps + k] = val;
            }
        return r;
    }

    // maillage d'un noeud (triangles, repere global, positions * unit) ; null s'il n'en a pas
    public Mesh MeshOf(string name)
    {
        GlbNode n;
        if (!ByName.TryGetValue(name, out n) || n.Mesh < 0) return null;
        var w = n.World();
        var m = new Mesh();
        foreach (var po in A(O(A(js, "meshes")[n.Mesh]), "primitives"))
        {
            var p = O(po);
            object v;
            if (p.TryGetValue("mode", out v) && I(v) != 4) continue;
            int cnt, comps;
            var pos = Floats(I(O(p["attributes"])["POSITION"]), out cnt, out comps);
            int baseV = m.VertexCount;
            for (int i = 0; i < cnt; i++)
            {
                double x, y, z;
                Mat.Apply(w, pos[3 * i], pos[3 * i + 1], pos[3 * i + 2], out x, out y, out z);
                m.P.Add(x * unit); m.P.Add(y * unit); m.P.Add(z * unit);
            }
            if (p.TryGetValue("indices", out v))
            {
                int ic, c1;
                var idx = Floats(I(v), out ic, out c1);
                for (int i = 0; i + 2 < ic; i += 3) { m.T.Add(baseV + (int)idx[i]); m.T.Add(baseV + (int)idx[i + 1]); m.T.Add(baseV + (int)idx[i + 2]); }
            }
            else for (int i = 0; i + 2 < cnt; i += 3) { m.T.Add(baseV + i); m.T.Add(baseV + i + 1); m.T.Add(baseV + i + 2); }
        }
        return m;
    }
}

public static class Shape
{
    // boite englobante [xmin, ymin, zmin, xmax, ymax, zmax]
    public static double[] Bounds(IList<Mesh> ms)
    {
        var b = new double[] { double.MaxValue, double.MaxValue, double.MaxValue, double.MinValue, double.MinValue, double.MinValue };
        foreach (var m in ms)
            for (int i = 0; i < m.P.Count; i += 3)
                for (int k = 0; k < 3; k++) { double v = m.P[i + k]; if (v < b[k]) b[k] = v; if (v > b[k + 3]) b[k + 3] = v; }
        return b;
    }

    // recalage axe par axe : la boite "src" est amenee sur la boite "dst"
    public static void MapBox(Mesh m, double[] src, double[] dst)
    {
        for (int i = 0; i < m.P.Count; i += 3)
            for (int k = 0; k < 3; k++)
            {
                double s = (dst[k + 3] - dst[k]) / (src[k + 3] - src[k]);
                m.P[i + k] = dst[k] + (m.P[i + k] - src[k]) * s;
            }
    }

    public static void Translate(Mesh m, double dx, double dy, double dz)
    {
        for (int i = 0; i < m.P.Count; i += 3) { m.P[i] += dx; m.P[i + 1] += dy; m.P[i + 2] += dz; }
    }

    // homothetie de centre (cx, cy, cz)
    public static void ScaleAbout(Mesh m, double cx, double cy, double cz, double s)
    {
        for (int i = 0; i < m.P.Count; i += 3)
        {
            m.P[i] = cx + (m.P[i] - cx) * s; m.P[i + 1] = cy + (m.P[i + 1] - cy) * s; m.P[i + 2] = cz + (m.P[i + 2] - cz) * s;
        }
    }

    // plus grand z (face anterieure) des sommets situes a moins de r du point (x, y) dans le plan frontal
    public static double MaxZNear(IList<Mesh> ms, double x, double y, double r)
    {
        double best = double.MinValue;
        foreach (var m in ms)
            for (int i = 0; i < m.P.Count; i += 3)
            {
                double dx = m.P[i] - x, dy = m.P[i + 1] - y;
                if (dx * dx + dy * dy <= r * r && m.P[i + 2] > best) best = m.P[i + 2];
            }
        return best;
    }

    // copie sans les sommets inutilises (un sommet isole fausserait la boite englobante)
    public static Mesh Compact(Mesh m)
    {
        var r = new Mesh(); var map = new Dictionary<int, int>();
        for (int t = 0; t < m.T.Count; t++)
        {
            int v = m.T[t], id;
            if (!map.TryGetValue(v, out id)) { id = r.VertexCount; map[v] = id; r.P.Add(m.P[3 * v]); r.P.Add(m.P[3 * v + 1]); r.P.Add(m.P[3 * v + 2]); }
            r.T.Add(id);
        }
        r.Tag.AddRange(m.Tag);
        return r;
    }

    // centre des sommets (null si vide)
    public static double[] Center(IList<Mesh> ms)
    {
        double[] s = { 0, 0, 0 }; long n = 0;
        foreach (var m in ms) for (int i = 0; i < m.P.Count; i += 3) { s[0] += m.P[i]; s[1] += m.P[i + 1]; s[2] += m.P[i + 2]; n++; }
        return n == 0 ? null : new[] { s[0] / n, s[1] / n, s[2] / n };
    }

    // centre des sommets dont la coordonnee "axis" est a moins de "tol" de "value" (null si aucun)
    public static double[] SliceCenter(Mesh m, int axis, double value, double tol)
    {
        double[] s = { 0, 0, 0 }; int n = 0;
        for (int i = 0; i < m.P.Count; i += 3)
            if (Math.Abs(m.P[i + axis] - value) <= tol) { s[0] += m.P[i]; s[1] += m.P[i + 1]; s[2] += m.P[i + 2]; n++; }
        return n == 0 ? null : new[] { s[0] / n, s[1] / n, s[2] / n };
    }

    // similitude : homothetie de rapport s et rotation d'angle "theta" (radians) dans le plan sagittal
    // (y, z), centrees sur "from", puis translation de "from" vers "to"
    public static void Similar(Mesh m, double[] from, double[] to, double s, double theta)
    {
        double c = Math.Cos(theta), sn = Math.Sin(theta);
        for (int i = 0; i < m.P.Count; i += 3)
        {
            double x = m.P[i] - from[0], y = m.P[i + 1] - from[1], z = m.P[i + 2] - from[2];
            m.P[i] = to[0] + s * x;
            m.P[i + 1] = to[1] + s * (c * y - sn * z);
            m.P[i + 2] = to[2] + s * (sn * y + c * z);
        }
    }

    // sommet extreme pres du plan sagittal x = xmid (|x - xmid| < tol) : celui qui maximise
    // a * y + b * z, parmi ceux dont y est au-dessus de yMin
    public static double[] Extreme(IList<Mesh> ms, double xmid, double tol, double a, double b, double yMin)
    {
        double[] best = null; double bs = double.MinValue;
        foreach (var m in ms)
            for (int i = 0; i < m.P.Count; i += 3)
            {
                if (Math.Abs(m.P[i] - xmid) >= tol || m.P[i + 1] < yMin) continue;
                double v = a * m.P[i + 1] + b * m.P[i + 2];
                if (v > bs) { bs = v; best = new[] { m.P[i], m.P[i + 1], m.P[i + 2] }; }
            }
        return best;
    }

    // sommet le plus bas a l'abscisse x (a 2 mm pres), en avant de zMin
    public static double[] Lowest(IList<Mesh> ms, double x, double zMin)
    {
        double[] best = null;
        foreach (var m in ms)
            for (int i = 0; i < m.P.Count; i += 3)
                if (Math.Abs(m.P[i] - x) < 2 && m.P[i + 2] > zMin && (best == null || m.P[i + 1] < best[1]))
                    best = new[] { m.P[i], m.P[i + 1], m.P[i + 2] };
        return best;
    }

    // ecrasement antero-posterieur : entre yLo et yHi (raccord progressif), les sommets situes a |x| < xMax
    // sont rapproches du plan z = zBack (facteur k au plus fort) ; sert a faire de la place a d'autres organes
    public static void SquashZ(Mesh m, double yLo, double yHi, double xMax, double zBack, double k)
    {
        for (int i = 0; i < m.P.Count; i += 3)
        {
            double y = m.P[i + 1], x = Math.Abs(m.P[i]);
            if (y <= yLo || y >= yHi || x >= xMax) continue;
            double t = Math.Sin(Math.PI * (y - yLo) / (yHi - yLo)); t *= t;
            double u = x < xMax * 0.6 ? 1 : 1 - (x - xMax * 0.6) / (xMax * 0.4);
            double f = 1 - (1 - k) * t * u;
            if (m.P[i + 2] > zBack) m.P[i + 2] = zBack + (m.P[i + 2] - zBack) * f;
        }
    }

    static double[] Sub(double[] a, double[] b) { return new[] { a[0] - b[0], a[1] - b[1], a[2] - b[2] }; }
    static double[] Cross(double[] a, double[] b) { return new[] { a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0] }; }
    static double Dot(double[] a, double[] b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
    static double[] Norm(double[] a) { double l = Math.Sqrt(Dot(a, a)); return l < 1e-12 ? new[] { 1.0, 0, 0 } : new[] { a[0] / l, a[1] / l, a[2] / l }; }

    // point d'une courbe de Catmull-Rom passant par les points de controle
    static double[] Spline(List<double[]> c, double t)
    {
        int n = c.Count - 1;
        double f = Math.Max(0, Math.Min(n - 1e-9, t * n));
        int i = (int)f; double u = f - i;
        var p0 = c[Math.Max(0, i - 1)]; var p1 = c[i]; var p2 = c[i + 1]; var p3 = c[Math.Min(n, i + 2)];
        var r = new double[3];
        for (int k = 0; k < 3; k++)
            r[k] = 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * u + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u * u + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u * u * u);
        return r;
    }

    // tube lisse le long d'un trajet (points x,y,z... ; un rayon par point, interpole), extremites arrondies ;
    // "flat" : aplatissement de la section (1 = ronde ; 0.6 : ovale, grand axe dans le plan du trajet)
    public static Mesh Tube(double[] pts, double[] radii, int rings, int seg, double flat)
    {
        var c = new List<double[]>();
        for (int i = 0; i + 2 < pts.Length; i += 3) c.Add(new[] { pts[i], pts[i + 1], pts[i + 2] });
        var m = new Mesh();
        var centers = new List<double[]>(); var rad = new List<double>();
        for (int r = 0; r <= rings; r++)
        {
            double t = r / (double)rings;
            centers.Add(Spline(c, t));
            double f = t * (radii.Length - 1); int i = Math.Min(radii.Length - 2, (int)f);
            rad.Add(radii[i] + (radii[i + 1] - radii[i]) * (f - i));
        }
        // reperes par transport parallele
        var T0 = Norm(Sub(centers[1], centers[0]));
        var N = Norm(Cross(T0, Math.Abs(T0[1]) < 0.9 ? new[] { 0.0, 1, 0 } : new[] { 1.0, 0, 0 }));
        var frames = new List<double[][]>();
        for (int r = 0; r <= rings; r++)
        {
            var T = Norm(Sub(centers[Math.Min(rings, r + 1)], centers[Math.Max(0, r - 1)]));
            N = Norm(Sub(N, new[] { T[0] * Dot(N, T), T[1] * Dot(N, T), T[2] * Dot(N, T) }));
            var B = Cross(T, N);
            frames.Add(new[] { T, N, B });
        }
        for (int r = 0; r <= rings; r++)
        {
            var N1 = frames[r][1]; var B1 = frames[r][2]; var p = centers[r];
            for (int s = 0; s < seg; s++)
            {
                double a = 2 * Math.PI * s / seg, ca = Math.Cos(a) * rad[r], sa = Math.Sin(a) * rad[r] * flat;
                m.P.Add(p[0] + N1[0] * ca + B1[0] * sa); m.P.Add(p[1] + N1[1] * ca + B1[1] * sa); m.P.Add(p[2] + N1[2] * ca + B1[2] * sa);
            }
        }
        for (int r = 0; r < rings; r++)
            for (int s = 0; s < seg; s++)
            {
                int a = r * seg + s, b = r * seg + (s + 1) % seg, cc = a + seg, d = b + seg;
                m.T.Add(a); m.T.Add(cc); m.T.Add(b); m.T.Add(b); m.T.Add(cc); m.T.Add(d);
            }
        // extremites : un sommet au bout, un peu au-dela du dernier anneau
        for (int e = 0; e < 2; e++)
        {
            int r = e == 0 ? 0 : rings;
            var T = frames[r][0]; double sg = e == 0 ? -1 : 1;
            var p = centers[r];
            int tip = m.VertexCount;
            m.P.Add(p[0] + sg * T[0] * rad[r] * 0.6); m.P.Add(p[1] + sg * T[1] * rad[r] * 0.6); m.P.Add(p[2] + sg * T[2] * rad[r] * 0.6);
            for (int s = 0; s < seg; s++)
            {
                int a = r * seg + s, b = r * seg + (s + 1) % seg;
                if (e == 0) { m.T.Add(tip); m.T.Add(a); m.T.Add(b); } else { m.T.Add(tip); m.T.Add(b); m.T.Add(a); }
            }
        }
        return m;
    }

    // ellipsoide de centre c, demi-axes a (le long de "dir"), b et cc (perpendiculaires ; b le plus horizontal)
    public static Mesh Ellipsoid(double[] c, double[] dir, double a, double b, double cc, int lat, int lon)
    {
        var U = Norm(dir);
        var V = Norm(Cross(Math.Abs(U[1]) < 0.9 ? new[] { 0.0, 1, 0 } : new[] { 0.0, 0, 1 }, U));
        var W = Cross(U, V);
        var m = new Mesh();
        for (int i = 0; i <= lat; i++)
        {
            double th = Math.PI * i / lat, ct = Math.Cos(th), st = Math.Sin(th);
            for (int j = 0; j < lon; j++)
            {
                double ph = 2 * Math.PI * j / lon, x = ct * a, y = st * Math.Cos(ph) * b, z = st * Math.Sin(ph) * cc;
                for (int k = 0; k < 3; k++) m.P.Add(c[k] + U[k] * x + V[k] * y + W[k] * z);
            }
        }
        for (int i = 0; i < lat; i++)
            for (int j = 0; j < lon; j++)
            {
                int p = i * lon + j, q = i * lon + (j + 1) % lon, r = p + lon, s = q + lon;
                if (i > 0) { m.T.Add(p); m.T.Add(q); m.T.Add(r); }
                if (i < lat - 1) { m.T.Add(q); m.T.Add(s); m.T.Add(r); }
            }
        return MeshIO.MergeWeld(new[] { m });
    }
}
