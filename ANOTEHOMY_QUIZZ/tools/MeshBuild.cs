// ==========================================================================
// MeshBuild.cs - preparation du squelette BodyParts3D pour le navigateur
// --------------------------------------------------------------------------
//  1. lit les fichiers OBJ voulus directement dans l'archive zip BodyParts3D
//  2. fusionne les elements d'un meme os et soude les sommets identiques
//  3. simplifie chaque maillage (metrique d'erreur quadrique, algorithme
//     "Fast Quadric Mesh Simplification" de S. Forstmann, licence MIT)
//  4. quantifie (Int16 / Uint16), compresse (gzip) et encode en base64
// C# 5 (compilateur de Windows PowerShell 5.1 via Add-Type).
// ==========================================================================
using System;
using System.IO;
using System.IO.Compression;
using System.Collections.Generic;
using System.Globalization;
using System.Text;

public class Mesh
{
    public List<double> P = new List<double>();   // x,y,z,x,y,z...
    public List<int> T = new List<int>();          // indices de triangles
    public List<byte> Tag = new List<byte>();      // element BodyParts3D d'origine (par triangle)
    public int VertexCount { get { return P.Count / 3; } }
    public int TriCount { get { return T.Count / 3; } }
}

public static class MeshIO
{
    static readonly char[] Sp = new[] { ' ', '\t' };

    public static Dictionary<string, Mesh> ReadZip(string zipPath, ICollection<string> ids)
    {
        var wanted = new HashSet<string>(ids, StringComparer.OrdinalIgnoreCase);
        var res = new Dictionary<string, Mesh>(StringComparer.OrdinalIgnoreCase);
        using (var zip = ZipFile.OpenRead(zipPath))
        {
            foreach (var e in zip.Entries)
            {
                string name = Path.GetFileNameWithoutExtension(e.Name);
                if (!wanted.Contains(name) || res.ContainsKey(name)) continue;
                using (var r = new StreamReader(e.Open())) res[name] = ReadObj(r);
            }
        }
        return res;
    }

    public static Mesh ReadObj(TextReader r)
    {
        var m = new Mesh();
        string line;
        var poly = new List<int>();
        while ((line = r.ReadLine()) != null)
        {
            if (line.Length < 2) continue;
            if (line[0] == 'v' && line[1] == ' ')
            {
                var p = line.Split(Sp, StringSplitOptions.RemoveEmptyEntries);
                m.P.Add(double.Parse(p[1], CultureInfo.InvariantCulture));
                m.P.Add(double.Parse(p[2], CultureInfo.InvariantCulture));
                m.P.Add(double.Parse(p[3], CultureInfo.InvariantCulture));
            }
            else if (line[0] == 'f' && line[1] == ' ')
            {
                var p = line.Split(Sp, StringSplitOptions.RemoveEmptyEntries);
                poly.Clear();
                for (int i = 1; i < p.Length; i++)
                {
                    string tok = p[i];
                    int slash = tok.IndexOf('/');
                    if (slash >= 0) tok = tok.Substring(0, slash);
                    int idx = int.Parse(tok, CultureInfo.InvariantCulture);
                    poly.Add(idx > 0 ? idx - 1 : m.VertexCount + idx);
                }
                for (int i = 1; i + 1 < poly.Count; i++) { m.T.Add(poly[0]); m.T.Add(poly[i]); m.T.Add(poly[i + 1]); }
            }
        }
        return m;
    }

    // fusion de plusieurs elements + soudure des sommets confondus (0.01 mm)
    public static Mesh MergeWeld(IList<Mesh> parts)
    {
        var res = new Mesh();
        var map = new Dictionary<long, int>();
        for (int pi = 0; pi < parts.Count; pi++)
        {
            var m = parts[pi];
            var remap = new int[m.VertexCount];
            for (int i = 0; i < m.VertexCount; i++)
            {
                double x = m.P[3 * i], y = m.P[3 * i + 1], z = m.P[3 * i + 2];
                long qx = (long)Math.Round(x * 100) + (1L << 20);
                long qy = (long)Math.Round(y * 100) + (1L << 20);
                long qz = (long)Math.Round(z * 100) + (1L << 20);
                long key = (qx << 42) | (qy << 21) | qz;
                int id;
                if (!map.TryGetValue(key, out id))
                {
                    id = res.VertexCount;
                    map[key] = id;
                    res.P.Add(x); res.P.Add(y); res.P.Add(z);
                }
                remap[i] = id;
            }
            for (int i = 0; i + 2 < m.T.Count; i += 3)
            {
                int a = remap[m.T[i]], b = remap[m.T[i + 1]], c = remap[m.T[i + 2]];
                if (a == b || b == c || a == c) continue;   // triangle degenere
                res.T.Add(a); res.T.Add(b); res.T.Add(c);
                res.Tag.Add((byte)pi);
            }
        }
        return res;
    }
}

// --------------------------------------------------------------------------
// Simplification par metrique d'erreur quadrique (Garland & Heckbert),
// d'apres "Fast Quadric Mesh Simplification" (Sven Forstmann, MIT).
// --------------------------------------------------------------------------
public class QemSimplifier
{
    class Tri { public int[] v = new int[3]; public double[] err = new double[4]; public bool deleted, dirty; public double nx, ny, nz; }
    class Vert { public double x, y, z; public int tstart, tcount; public double[] q = new double[10]; public bool border; }
    struct Ref { public int tid, tvertex; }

    List<Tri> tris = new List<Tri>();
    List<Vert> verts = new List<Vert>();
    List<Ref> refs = new List<Ref>();

    public QemSimplifier(Mesh m)
    {
        for (int i = 0; i < m.VertexCount; i++)
            verts.Add(new Vert { x = m.P[3 * i], y = m.P[3 * i + 1], z = m.P[3 * i + 2] });
        for (int i = 0; i + 2 < m.T.Count; i += 3)
        {
            var t = new Tri();
            t.v[0] = m.T[i]; t.v[1] = m.T[i + 1]; t.v[2] = m.T[i + 2];
            tris.Add(t);
        }
    }

    public Mesh ToMesh()
    {
        var m = new Mesh();
        foreach (var v in verts) { m.P.Add(v.x); m.P.Add(v.y); m.P.Add(v.z); }
        foreach (var t in tris) { m.T.Add(t.v[0]); m.T.Add(t.v[1]); m.T.Add(t.v[2]); }
        return m;
    }

    static double VertexError(double[] q, double x, double y, double z)
    {
        return q[0] * x * x + 2 * q[1] * x * y + 2 * q[2] * x * z + 2 * q[3] * x + q[4] * y * y
             + 2 * q[5] * y * z + 2 * q[6] * y + q[7] * z * z + 2 * q[8] * z + q[9];
    }

    static double Det(double[] m, int a11, int a12, int a13, int a21, int a22, int a23, int a31, int a32, int a33)
    {
        return m[a11] * m[a22] * m[a33] + m[a13] * m[a21] * m[a32] + m[a12] * m[a23] * m[a31]
             - m[a13] * m[a22] * m[a31] - m[a11] * m[a23] * m[a32] - m[a12] * m[a21] * m[a33];
    }

    double CalcError(int i1, int i2, out double px, out double py, out double pz)
    {
        Vert a = verts[i1], b = verts[i2];
        var q = new double[10];
        for (int k = 0; k < 10; k++) q[k] = a.q[k] + b.q[k];
        bool border = a.border && b.border;
        double det = Det(q, 0, 1, 2, 1, 4, 5, 2, 5, 7);
        if (det != 0 && !border)
        {
            px = -1 / det * Det(q, 1, 2, 3, 4, 5, 6, 5, 7, 8);
            py = 1 / det * Det(q, 0, 2, 3, 1, 5, 6, 2, 7, 8);
            pz = -1 / det * Det(q, 0, 1, 3, 1, 4, 6, 2, 5, 8);
            // garde-fou : position optimale trop eloignee de l'arete (matrice presque singuliere)
            double mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, mz = (a.z + b.z) / 2;
            double el = Math.Sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y) + (a.z - b.z) * (a.z - b.z));
            double dd = Math.Sqrt((px - mx) * (px - mx) + (py - my) * (py - my) + (pz - mz) * (pz - mz));
            if (!double.IsNaN(dd) && dd <= 2 * el + 1e-9) return VertexError(q, px, py, pz);
        }
        double e1 = VertexError(q, a.x, a.y, a.z);
        double e2 = VertexError(q, b.x, b.y, b.z);
        double cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2, cz = (a.z + b.z) / 2;
        double e3 = VertexError(q, cx, cy, cz);
        double err = Math.Min(e1, Math.Min(e2, e3));
        if (err == e1) { px = a.x; py = a.y; pz = a.z; }
        else if (err == e2) { px = b.x; py = b.y; pz = b.z; }
        else { px = cx; py = cy; pz = cz; }
        return err;
    }

    bool Flipped(double px, double py, double pz, int i0, int i1, Vert v0, int[] deleted)
    {
        for (int k = 0; k < v0.tcount; k++)
        {
            Ref r = refs[v0.tstart + k];
            Tri t = tris[r.tid];
            if (t.deleted) continue;
            int s = r.tvertex;
            int id1 = t.v[(s + 1) % 3], id2 = t.v[(s + 2) % 3];
            if (id1 == i1 || id2 == i1) { deleted[k] = 1; continue; }
            double d1x = verts[id1].x - px, d1y = verts[id1].y - py, d1z = verts[id1].z - pz;
            double d2x = verts[id2].x - px, d2y = verts[id2].y - py, d2z = verts[id2].z - pz;
            double l1 = Math.Sqrt(d1x * d1x + d1y * d1y + d1z * d1z), l2 = Math.Sqrt(d2x * d2x + d2y * d2y + d2z * d2z);
            if (l1 == 0 || l2 == 0) return true;
            d1x /= l1; d1y /= l1; d1z /= l1; d2x /= l2; d2y /= l2; d2z /= l2;
            if (Math.Abs(d1x * d2x + d1y * d2y + d1z * d2z) > 0.999) return true;
            double nx = d1y * d2z - d1z * d2y, ny = d1z * d2x - d1x * d2z, nz = d1x * d2y - d1y * d2x;
            double nl = Math.Sqrt(nx * nx + ny * ny + nz * nz);
            if (nl == 0) return true;
            nx /= nl; ny /= nl; nz /= nl;
            deleted[k] = 0;
            if (nx * t.nx + ny * t.ny + nz * t.nz < 0.2) return true;
        }
        return false;
    }

    void UpdateTriangles(int i0, Vert v, int[] deleted, ref int deletedTriangles)
    {
        double px, py, pz;
        for (int k = 0; k < v.tcount; k++)
        {
            Ref r = refs[v.tstart + k];
            Tri t = tris[r.tid];
            if (t.deleted) continue;
            if (deleted[k] == 1) { t.deleted = true; deletedTriangles++; continue; }
            t.v[r.tvertex] = i0;
            t.dirty = true;
            t.err[0] = CalcError(t.v[0], t.v[1], out px, out py, out pz);
            t.err[1] = CalcError(t.v[1], t.v[2], out px, out py, out pz);
            t.err[2] = CalcError(t.v[2], t.v[0], out px, out py, out pz);
            t.err[3] = Math.Min(t.err[0], Math.Min(t.err[1], t.err[2]));
            refs.Add(r);
        }
    }

    void UpdateMesh(int iteration)
    {
        if (iteration > 0)
        {
            var keep = new List<Tri>(tris.Count);
            foreach (var t in tris) if (!t.deleted) keep.Add(t);
            tris = keep;
        }
        foreach (var v in verts) { v.tstart = 0; v.tcount = 0; }
        foreach (var t in tris) for (int j = 0; j < 3; j++) verts[t.v[j]].tcount++;
        int ts = 0;
        foreach (var v in verts) { v.tstart = ts; ts += v.tcount; v.tcount = 0; }
        refs = new List<Ref>(new Ref[tris.Count * 3]);
        for (int i = 0; i < tris.Count; i++)
        {
            Tri t = tris[i];
            for (int j = 0; j < 3; j++)
            {
                Vert v = verts[t.v[j]];
                refs[v.tstart + v.tcount] = new Ref { tid = i, tvertex = j };
                v.tcount++;
            }
        }
        if (iteration != 0) return;

        // sommets de bord
        var vcount = new List<int>();
        var vids = new List<int>();
        foreach (var v in verts) v.border = false;
        foreach (var v in verts)
        {
            vcount.Clear(); vids.Clear();
            for (int j = 0; j < v.tcount; j++)
            {
                Tri t = tris[refs[v.tstart + j].tid];
                for (int k = 0; k < 3; k++)
                {
                    int id = t.v[k], ofs = 0;
                    while (ofs < vcount.Count) { if (vids[ofs] == id) break; ofs++; }
                    if (ofs == vcount.Count) { vcount.Add(1); vids.Add(id); } else vcount[ofs]++;
                }
            }
            for (int j = 0; j < vcount.Count; j++) if (vcount[j] == 1) verts[vids[j]].border = true;
        }
        // quadriques initiales (plans des triangles)
        foreach (var v in verts) for (int k = 0; k < 10; k++) v.q[k] = 0;
        foreach (var t in tris)
        {
            Vert p0 = verts[t.v[0]], p1 = verts[t.v[1]], p2 = verts[t.v[2]];
            double ux = p1.x - p0.x, uy = p1.y - p0.y, uz = p1.z - p0.z;
            double wx = p2.x - p0.x, wy = p2.y - p0.y, wz = p2.z - p0.z;
            double nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
            double nl = Math.Sqrt(nx * nx + ny * ny + nz * nz);
            if (nl > 0) { nx /= nl; ny /= nl; nz /= nl; } else { nx = ny = nz = 0; }
            t.nx = nx; t.ny = ny; t.nz = nz;
            double d = -(nx * p0.x + ny * p0.y + nz * p0.z);
            double[] pq = { nx * nx, nx * ny, nx * nz, nx * d, ny * ny, ny * nz, ny * d, nz * nz, nz * d, d * d };
            for (int j = 0; j < 3; j++) { var q = verts[t.v[j]].q; for (int k = 0; k < 10; k++) q[k] += pq[k]; }
        }
        double px, py, pz;
        foreach (var t in tris)
        {
            for (int j = 0; j < 3; j++) t.err[j] = CalcError(t.v[j], t.v[(j + 1) % 3], out px, out py, out pz);
            t.err[3] = Math.Min(t.err[0], Math.Min(t.err[1], t.err[2]));
        }
    }

    void CompactMesh()
    {
        foreach (var v in verts) v.tcount = 0;
        var keep = new List<Tri>(tris.Count);
        foreach (var t in tris)
        {
            if (t.deleted) continue;
            keep.Add(t);
            for (int j = 0; j < 3; j++) verts[t.v[j]].tcount = 1;
        }
        tris = keep;
        var nv = new List<Vert>();
        foreach (var v in verts)
        {
            if (v.tcount == 0) continue;
            v.tstart = nv.Count;
            nv.Add(new Vert { x = v.x, y = v.y, z = v.z });
        }
        foreach (var t in tris) for (int j = 0; j < 3; j++) t.v[j] = verts[t.v[j]].tstart;
        verts = nv;
    }

    public void Simplify(int targetCount, double aggressiveness)
    {
        foreach (var t in tris) t.deleted = false;
        int deletedTriangles = 0;
        int triangleCount = tris.Count;
        double px, py, pz;
        for (int iteration = 0; iteration < 100; iteration++)
        {
            if (triangleCount - deletedTriangles <= targetCount) break;
            if (iteration % 5 == 0) UpdateMesh(iteration);
            foreach (var t in tris) t.dirty = false;
            double threshold = 0.000000001 * Math.Pow(iteration + 3, aggressiveness);
            for (int i = 0; i < tris.Count; i++)
            {
                Tri t = tris[i];
                if (t.err[3] > threshold || t.deleted || t.dirty) continue;
                for (int j = 0; j < 3; j++)
                {
                    if (t.err[j] >= threshold) continue;
                    int i0 = t.v[j]; Vert v0 = verts[i0];
                    int i1 = t.v[(j + 1) % 3]; Vert v1 = verts[i1];
                    if (v0.border != v1.border) continue;
                    CalcError(i0, i1, out px, out py, out pz);
                    var del0 = new int[v0.tcount];
                    var del1 = new int[v1.tcount];
                    if (Flipped(px, py, pz, i0, i1, v0, del0)) continue;
                    if (Flipped(px, py, pz, i1, i0, v1, del1)) continue;
                    v0.x = px; v0.y = py; v0.z = pz;
                    for (int k = 0; k < 10; k++) v0.q[k] += v1.q[k];
                    int tstart = refs.Count;
                    UpdateTriangles(i0, v0, del0, ref deletedTriangles);
                    UpdateTriangles(i0, v1, del1, ref deletedTriangles);
                    int tcount = refs.Count - tstart;
                    if (tcount <= v0.tcount) { for (int k = 0; k < tcount; k++) refs[v0.tstart + k] = refs[tstart + k]; }
                    else v0.tstart = tstart;
                    v0.tcount = tcount;
                    break;
                }
                if (triangleCount - deletedTriangles <= targetCount) break;
            }
        }
        CompactMesh();
    }
}

// --------------------------------------------------------------------------
// Pilote : table de correspondance -> parties simplifiees
// --------------------------------------------------------------------------
public static class Builder
{
    public class MapRow { public string Bone, Side, Label, Concept; public List<string> Files = new List<string>(); }

    // lit bp3d-map.csv (bone;side;label;bp3d) et resout les concepts en fichiers FJ
    public static List<MapRow> LoadMap(string mapCsv, string[] elementTables)
    {
        var idx = new Dictionary<string, List<string>>();
        foreach (var table in elementTables)
        {
            bool first = true;
            foreach (var line in File.ReadAllLines(table))
            {
                if (first) { first = false; continue; }
                var c = line.Split('\t');
                if (c.Length < 3) continue;
                List<string> l;
                if (!idx.TryGetValue(c[1], out l)) { l = new List<string>(); idx[c[1]] = l; }
                if (!l.Contains(c[2])) l.Add(c[2]);
            }
        }
        var rows = new List<MapRow>();
        bool head = true;
        foreach (var line in File.ReadAllLines(mapCsv))
        {
            if (head) { head = false; continue; }
            if (line.Trim().Length == 0) continue;
            var c = line.Split(';');
            var r = new MapRow { Bone = c[0], Side = c[1], Label = c[2], Concept = c[3] };
            List<string> l;
            if (!idx.TryGetValue(r.Concept, out l)) throw new Exception("Concept introuvable : " + r.Concept);
            r.Files.AddRange(l);
            rows.Add(r);
        }
        return rows;
    }

    public static List<Part> LoadParts(string zipPath, List<MapRow> rows)
    {
        var ids = new HashSet<string>();
        foreach (var r in rows) foreach (var f in r.Files) ids.Add(f);
        var meshes = MeshIO.ReadZip(zipPath, ids);
        var parts = new List<Part>();
        foreach (var r in rows)
        {
            var list = new List<Mesh>();
            foreach (var f in r.Files) { Mesh m; if (meshes.TryGetValue(f, out m)) list.Add(m); else throw new Exception("Fichier absent du zip : " + f); }
            bool deco = r.Bone.StartsWith("#");
            parts.Add(new Part { Bone = deco ? r.Bone.Substring(1) : r.Bone, Side = r.Side, Label = r.Label,
                Kind = deco ? "d" : "b", Mesh = MeshIO.MergeWeld(list) });
        }
        return parts;
    }

    public static string Stats(List<Part> parts)
    {
        var sb = new StringBuilder();
        long tv = 0, tt = 0;
        foreach (var p in parts)
        {
            double[] mn = { double.MaxValue, double.MaxValue, double.MaxValue }, mx = { double.MinValue, double.MinValue, double.MinValue };
            for (int i = 0; i < p.Mesh.P.Count; i += 3)
                for (int k = 0; k < 3; k++) { double v = p.Mesh.P[i + k]; if (v < mn[k]) mn[k] = v; if (v > mx[k]) mx[k] = v; }
            sb.AppendLine(string.Format(CultureInfo.InvariantCulture, "{0}|{1}|{2}|{3}|v={4}|t={5}|x={6:F0}..{7:F0}|y={8:F0}..{9:F0}|z={10:F0}..{11:F0}",
                p.Kind, p.Bone, p.Side, p.Label, p.Mesh.VertexCount, p.Mesh.TriCount, mn[0], mx[0], mn[1], mx[1], mn[2], mx[2]));
            tv += p.Mesh.VertexCount; tt += p.Mesh.TriCount;
        }
        sb.AppendLine("TOTAL parties=" + parts.Count + " sommets=" + tv + " triangles=" + tt);
        return sb.ToString();
    }

    // Dans BodyParts3D, le coccyx est fusionne au maillage du sacrum.
    // On le separe au niveau de l'articulation sacro-coccygienne : la tranche
    // horizontale la plus etroite entre 22 et 46 mm au-dessus de la pointe.
    // up = axe vertical source (BodyParts3D : 2 = z), lat = axe transversal (0 = x).
    public static string SplitCoccyx(List<Part> parts, int up, int lat)
    {
        return SplitCoccyx(parts, up, lat, true);
    }
    public static string SplitCoccyx(List<Part> parts, int up, int lat, bool keepCoccyx)
    {
        int si = parts.FindIndex(p => p.Bone == "sacrum");
        if (si < 0) return "sacrum absent : coccyx non separe";
        var m = parts[si].Mesh;
        double minUp = double.MaxValue;
        for (int i = 0; i < m.P.Count; i += 3) minUp = Math.Min(minUp, m.P[i + up]);
        double best = double.MaxValue, cut = minUp + 33;
        for (double h = 22; h <= 46; h += 2)
        {
            double lo = minUp + h, hi = lo + 2, mn = double.MaxValue, mx = double.MinValue;
            for (int i = 0; i < m.P.Count; i += 3)
            {
                double u = m.P[i + up];
                if (u < lo || u >= hi) continue;
                double x = m.P[i + lat];
                if (x < mn) mn = x; if (x > mx) mx = x;
            }
            if (mx > mn && mx - mn < best) { best = mx - mn; cut = lo + 1; }
        }
        // repartition des triangles selon la hauteur de leur centre
        var below = new Mesh(); var above = new Mesh();
        var mapB = new Dictionary<int, int>(); var mapA = new Dictionary<int, int>();
        for (int t = 0; t + 2 < m.T.Count; t += 3)
        {
            double cu = (m.P[3 * m.T[t] + up] + m.P[3 * m.T[t + 1] + up] + m.P[3 * m.T[t + 2] + up]) / 3;
            bool low = cu < cut;
            var dst = low ? below : above; var map = low ? mapB : mapA;
            for (int k = 0; k < 3; k++)
            {
                int v = m.T[t + k], id;
                if (!map.TryGetValue(v, out id))
                {
                    id = dst.VertexCount; map[v] = id;
                    dst.P.Add(m.P[3 * v]); dst.P.Add(m.P[3 * v + 1]); dst.P.Add(m.P[3 * v + 2]);
                }
                dst.T.Add(id);
            }
            dst.Tag.Add(m.Tag.Count > t / 3 ? m.Tag[t / 3] : (byte)0);
        }
        parts[si].Mesh = above;
        if (keepCoccyx) parts.Insert(si + 1, new Part { Bone = "coccyx", Side = "", Label = "", Kind = "b", Mesh = below });
        return string.Format(CultureInfo.InvariantCulture,
            "coccyx separe du sacrum a {0:F0} mm de la pointe (largeur {1:F1} mm) : {2} triangles",
            cut - minUp, best, below.TriCount);
    }

    // objectif par partie : t * r borne a [minT, maxT] (et jamais plus que l'original),
    // r ajuste par dichotomie pour respecter le budget global de triangles
    public static int[] Targets(List<Part> parts, long budget, int minT, int maxT, double decoFactor)
    {
        double lo = 0, hi = 1;
        int[] best = null;
        for (int it = 0; it < 50; it++)
        {
            double r = (lo + hi) / 2;
            var tg = new int[parts.Count];
            long sum = 0;
            for (int i = 0; i < parts.Count; i++)
            {
                int t = parts[i].Mesh.TriCount;
                double f = parts[i].Kind == "d" ? r * decoFactor : r;
                int g = (int)Math.Round(t * f);
                int mn = parts[i].Kind == "d" ? minT / 2 : minT;
                if (g < mn) g = mn;
                if (g > maxT) g = maxT;
                if (g > t) g = t;
                tg[i] = g; sum += g;
            }
            best = tg;
            if (sum > budget) hi = r; else lo = r;
        }
        return best;
    }

    public static string Simplify(List<Part> parts, int[] targets, double aggressiveness)
    {
        var sb = new StringBuilder();
        for (int i = 0; i < parts.Count; i++)
        {
            var p = parts[i];
            if (targets[i] >= p.Mesh.TriCount) continue;
            var s = new QemSimplifier(p.Mesh);
            s.Simplify(targets[i], aggressiveness);
            var m = s.ToMesh();
            if (m.TriCount < targets[i] * 0.5) sb.AppendLine("ATTENTION " + p.Bone + " " + p.Label + " : " + m.TriCount + " / " + targets[i]);
            p.Mesh = m;
        }
        return sb.ToString();
    }
}

// --------------------------------------------------------------------------
// Assemblage final : une "partie" par instance d'os, positions quantifiees.
// --------------------------------------------------------------------------
public class Part
{
    public string Bone, Side, Label, Kind;
    public Mesh Mesh;
}

public static class Packer
{
    // Repere de sortie (Three.js) : x = gauche du sujet, y = haut, z = anterieur.
    // ax/ay/az : axes source a utiliser (0,1,2) ; sx/sy/sz : signes.
    public static string Pack(IList<Part> parts, int ax, int ay, int az, int sx, int sy, int sz, out string stats)
    {
        return Pack(parts, ax, ay, az, sx, sy, sz, false, out stats);
    }
    // withTags : ajoute apres les indices un octet par triangle (element BodyParts3D d'origine)
    public static string Pack(IList<Part> parts, int ax, int ay, int az, int sx, int sy, int sz, bool withTags, out string stats)
    {
        // transformation de repere + boite englobante globale
        double[] min = { double.MaxValue, double.MaxValue, double.MaxValue };
        double[] max = { double.MinValue, double.MinValue, double.MinValue };
        var conv = new List<double[]>();
        int[] axes = { ax, ay, az }; int[] sg = { sx, sy, sz };
        foreach (var p in parts)
        {
            var src = p.Mesh.P;
            var dst = new double[src.Count];
            for (int i = 0; i < src.Count; i += 3)
                for (int k = 0; k < 3; k++)
                {
                    double val = sg[k] * src[i + axes[k]];
                    dst[i + k] = val;
                    if (val < min[k]) min[k] = val;
                    if (val > max[k]) max[k] = val;
                }
            conv.Add(dst);
        }
        // quantification sur 16 bits, meme echelle sur les 3 axes
        double span = Math.Max(max[0] - min[0], Math.Max(max[1] - min[1], max[2] - min[2]));
        double scale = span / 65535.0;
        var ms = new MemoryStream();
        var bw = new BinaryWriter(ms);
        var meta = new StringBuilder();
        int vOff = 0, iOff = 0;
        long tris = 0;
        for (int n = 0; n < parts.Count; n++)
        {
            var p = parts[n]; var d = conv[n];
            int vc = d.Length / 3;
            if (vc > 65535) throw new Exception("Trop de sommets pour " + p.Bone + " " + p.Label);
            for (int i = 0; i < d.Length; i += 3)
                for (int k = 0; k < 3; k++)
                    bw.Write((short)(Math.Round((d[i + k] - min[k]) / scale) - 32768));
            meta.Append(string.Format(CultureInfo.InvariantCulture, "{0}[\"{1}\",\"{2}\",\"{3}\",\"{4}\",{5},{6}]",
                n == 0 ? "" : ",\n    ", p.Kind, p.Bone, p.Side, p.Label, vc, p.Mesh.T.Count));
            vOff += vc; iOff += p.Mesh.T.Count; tris += p.Mesh.T.Count / 3;
        }
        foreach (var p in parts) foreach (int ix in p.Mesh.T) bw.Write((ushort)ix);
        if (withTags)
            foreach (var p in parts)
                for (int t = 0; t < p.Mesh.TriCount; t++) bw.Write(p.Mesh.Tag.Count > t ? p.Mesh.Tag[t] : (byte)0);
        bw.Flush();
        byte[] raw = ms.ToArray();
        var gz = new MemoryStream();
        using (var z = new GZipStream(gz, CompressionMode.Compress, true)) z.Write(raw, 0, raw.Length);
        byte[] packed = gz.ToArray();
        stats = string.Format(CultureInfo.InvariantCulture, "parties={0} sommets={1} triangles={2} brut={3:F2} Mo gzip={4:F2} Mo base64={5:F2} Mo",
            parts.Count, vOff, tris, raw.Length / 1048576.0, packed.Length / 1048576.0, Math.Ceiling(packed.Length / 3.0) * 4 / 1048576.0);
        var js = new StringBuilder();
        js.Append(string.Format(CultureInfo.InvariantCulture,
            "{{\n  min: [{0:F3}, {1:F3}, {2:F3}],\n  scale: {3:R},\n  vertices: {4},\n  indices: {5},\n  tags: {6},\n  parts: [\n    {7}\n  ],\n  data: '",
            min[0], min[1], min[2], scale, vOff, iOff, withTags ? "true" : "false", meta));
        js.Append(Convert.ToBase64String(packed));
        js.Append("'\n}");
        return js.ToString();
    }
}
