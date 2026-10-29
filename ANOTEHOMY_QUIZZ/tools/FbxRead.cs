// ==========================================================================
// FbxRead.cs - lecture des modeles FBX binaires (Z-Anatomy) pour le jeu des muscles
// --------------------------------------------------------------------------
//  - format FBX binaire 7.x : arbre de noeuds, proprietes typees, tableaux
//    eventuellement compresses (zlib) ;
//  - objets "Model" (hierarchie par les connexions "OO"), "Geometry"
//    (sommets, polygones) et leurs transformations (translation, rotation,
//    echelle, pre-rotation, pivots, transformation geometrique) ;
//  - chaque maillage est rendu dans le repere global du fichier, en triangles.
// C# 5 (compilateur de Windows PowerShell 5.1 via Add-Type).
// ==========================================================================
using System;
using System.IO;
using System.IO.Compression;
using System.Collections.Generic;
using System.Globalization;
using System.Text;

public class FbxNode
{
    public string Name;
    public List<object> Props = new List<object>();
    public List<FbxNode> Children = new List<FbxNode>();
    public FbxNode Child(string n) { foreach (var c in Children) if (c.Name == n) return c; return null; }
}

public class FbxModel
{
    public long Id;
    public string Name, Type;
    public FbxModel Parent;
    public double[] Local = Mat.Identity(), Geo = Mat.Identity();
    public long GeometryId = -1;
    public double[] World()
    {
        return Parent == null ? Local : Mat.Mul(Parent.World(), Local);
    }
}

public class FbxGeometry
{
    public long Id;
    public string Name;
    public double[] Vertices;
    public int[] Polygons;
}

// matrices 4 x 4 en colonnes (m[col * 4 + row]), vecteurs colonnes
public static class Mat
{
    public static double[] Identity() { return new double[] { 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 }; }
    public static double[] Mul(double[] a, double[] b)
    {
        var r = new double[16];
        for (int c = 0; c < 4; c++)
            for (int rr = 0; rr < 4; rr++)
            {
                double s = 0;
                for (int k = 0; k < 4; k++) s += a[k * 4 + rr] * b[c * 4 + k];
                r[c * 4 + rr] = s;
            }
        return r;
    }
    public static double[] Translate(double x, double y, double z) { var m = Identity(); m[12] = x; m[13] = y; m[14] = z; return m; }
    public static double[] Scale(double x, double y, double z) { var m = Identity(); m[0] = x; m[5] = y; m[10] = z; return m; }
    static double[] Rx(double a) { double c = Math.Cos(a), s = Math.Sin(a); var m = Identity(); m[5] = c; m[6] = s; m[9] = -s; m[10] = c; return m; }
    static double[] Ry(double a) { double c = Math.Cos(a), s = Math.Sin(a); var m = Identity(); m[0] = c; m[2] = -s; m[8] = s; m[10] = c; return m; }
    static double[] Rz(double a) { double c = Math.Cos(a), s = Math.Sin(a); var m = Identity(); m[0] = c; m[1] = s; m[4] = -s; m[5] = c; return m; }
    // angles d'Euler en degres ; ordre FBX "XYZ" (0) : X d'abord, donc R = Rz * Ry * Rx
    public static double[] Euler(double[] d, int order)
    {
        double k = Math.PI / 180;
        var x = Rx(d[0] * k); var y = Ry(d[1] * k); var z = Rz(d[2] * k);
        switch (order)
        {
            case 1: return Mul(y, Mul(z, x));   // XZY
            case 2: return Mul(x, Mul(z, y));   // YZX
            case 3: return Mul(z, Mul(x, y));   // YXZ
            case 4: return Mul(x, Mul(y, z));   // ZXY
            case 5: return Mul(y, Mul(x, z));   // ZYX
            default: return Mul(z, Mul(y, x));  // XYZ
        }
    }
    public static double[] Inverse(double[] m)
    {
        // inverse generale (Gauss-Jordan)
        var a = new double[4, 8];
        for (int r = 0; r < 4; r++) { for (int c = 0; c < 4; c++) a[r, c] = m[c * 4 + r]; a[r, 4 + r] = 1; }
        for (int c = 0; c < 4; c++)
        {
            int p = c;
            for (int r = c + 1; r < 4; r++) if (Math.Abs(a[r, c]) > Math.Abs(a[p, c])) p = r;
            for (int k = 0; k < 8; k++) { double t = a[c, k]; a[c, k] = a[p, k]; a[p, k] = t; }
            double d = a[c, c];
            for (int k = 0; k < 8; k++) a[c, k] /= d;
            for (int r = 0; r < 4; r++)
            {
                if (r == c) continue;
                double f = a[r, c];
                for (int k = 0; k < 8; k++) a[r, k] -= f * a[c, k];
            }
        }
        var res = new double[16];
        for (int r = 0; r < 4; r++) for (int c = 0; c < 4; c++) res[c * 4 + r] = a[r, 4 + c];
        return res;
    }
    public static double Det3(double[] m)
    {
        return m[0] * (m[5] * m[10] - m[9] * m[6]) - m[4] * (m[1] * m[10] - m[9] * m[2]) + m[8] * (m[1] * m[6] - m[5] * m[2]);
    }
    public static void Apply(double[] m, double x, double y, double z, out double ox, out double oy, out double oz)
    {
        ox = m[0] * x + m[4] * y + m[8] * z + m[12];
        oy = m[1] * x + m[5] * y + m[9] * z + m[13];
        oz = m[2] * x + m[6] * y + m[10] * z + m[14];
    }
}

public class FbxScene
{
    public uint Version;
    public Dictionary<long, FbxModel> Models = new Dictionary<long, FbxModel>();
    public Dictionary<long, FbxGeometry> Geometries = new Dictionary<long, FbxGeometry>();
    public double UnitScale = 1;
    public int UpAxis = 1, UpSign = 1, FrontAxis = 2, FrontSign = 1, CoordAxis = 0, CoordSign = 1;

    // ---------------- lecture binaire ----------------
    public static FbxScene Load(string path)
    {
        byte[] b = File.ReadAllBytes(path);
        if (Encoding.ASCII.GetString(b, 0, 18) != "Kaydara FBX Binary") throw new Exception("FBX binaire attendu : " + path);
        var sc = new FbxScene();
        sc.Version = BitConverter.ToUInt32(b, 23);
        int pos = 27;
        var root = new FbxNode { Name = "" };
        while (pos < b.Length)
        {
            var n = ReadNode(b, ref pos, sc.Version);
            if (n == null) break;
            root.Children.Add(n);
        }
        sc.Build(root);
        return sc;
    }

    static FbxNode ReadNode(byte[] b, ref int pos, uint version)
    {
        long end, numProps;
        if (version >= 7500) { end = (long)BitConverter.ToUInt64(b, pos); numProps = (long)BitConverter.ToUInt64(b, pos + 8); pos += 24; }
        else { end = BitConverter.ToUInt32(b, pos); numProps = BitConverter.ToUInt32(b, pos + 4); pos += 12; }
        int nameLen = b[pos]; pos++;
        if (end == 0) return null;
        var node = new FbxNode { Name = Encoding.ASCII.GetString(b, pos, nameLen) };
        pos += nameLen;
        for (long i = 0; i < numProps; i++) node.Props.Add(ReadProp(b, ref pos));
        while (pos < end)
        {
            var c = ReadNode(b, ref pos, version);
            if (c == null) break;
            node.Children.Add(c);
        }
        pos = (int)end;
        return node;
    }

    static object ReadProp(byte[] b, ref int pos)
    {
        char t = (char)b[pos]; pos++;
        switch (t)
        {
            case 'Y': { var v = BitConverter.ToInt16(b, pos); pos += 2; return (int)v; }
            case 'C': { var v = b[pos] != 0; pos += 1; return v; }
            case 'I': { var v = BitConverter.ToInt32(b, pos); pos += 4; return v; }
            case 'F': { var v = BitConverter.ToSingle(b, pos); pos += 4; return (double)v; }
            case 'D': { var v = BitConverter.ToDouble(b, pos); pos += 8; return v; }
            case 'L': { var v = BitConverter.ToInt64(b, pos); pos += 8; return v; }
            case 'S':
            case 'R':
            {
                int len = BitConverter.ToInt32(b, pos); pos += 4;
                if (t == 'S') { var s = Encoding.GetEncoding(28591).GetString(b, pos, len); pos += len; return s; }
                var raw = new byte[len]; Buffer.BlockCopy(b, pos, raw, 0, len); pos += len; return raw;
            }
            case 'f': case 'd': case 'l': case 'i': case 'b':
            {
                int count = BitConverter.ToInt32(b, pos), enc = BitConverter.ToInt32(b, pos + 4), clen = BitConverter.ToInt32(b, pos + 8);
                pos += 12;
                int esz = t == 'd' || t == 'l' ? 8 : t == 'b' ? 1 : 4;
                byte[] data;
                if (enc == 1)
                {
                    data = new byte[count * esz];
                    using (var ms = new MemoryStream(b, pos + 2, clen - 2))
                    using (var z = new DeflateStream(ms, CompressionMode.Decompress))
                    {
                        int got = 0;
                        while (got < data.Length) { int n = z.Read(data, got, data.Length - got); if (n <= 0) break; got += n; }
                    }
                }
                else { data = new byte[count * esz]; Buffer.BlockCopy(b, pos, data, 0, data.Length); }
                pos += clen;
                if (t == 'd') { var a = new double[count]; Buffer.BlockCopy(data, 0, a, 0, data.Length); return a; }
                if (t == 'f') { var a = new float[count]; Buffer.BlockCopy(data, 0, a, 0, data.Length); var d = new double[count]; for (int i = 0; i < count; i++) d[i] = a[i]; return d; }
                if (t == 'i') { var a = new int[count]; Buffer.BlockCopy(data, 0, a, 0, data.Length); return a; }
                if (t == 'l') { var a = new long[count]; Buffer.BlockCopy(data, 0, a, 0, data.Length); return a; }
                return data;
            }
            default: throw new Exception("Type de propriete FBX inconnu : " + t + " a " + pos);
        }
    }

    // ---------------- interpretation ----------------
    static string CleanName(string s) { int i = s.IndexOf("\u0000\u0001"); return i >= 0 ? s.Substring(0, i) : s; }
    static double[] Vec(FbxNode p70, string name, double dx, double dy, double dz)
    {
        if (p70 != null) foreach (var p in p70.Children)
                if (p.Props.Count >= 7 && (string)p.Props[0] == name) return new[] { Convert.ToDouble(p.Props[4]), Convert.ToDouble(p.Props[5]), Convert.ToDouble(p.Props[6]) };
        return new[] { dx, dy, dz };
    }
    static int Int(FbxNode p70, string name, int def)
    {
        if (p70 != null) foreach (var p in p70.Children)
                if (p.Props.Count >= 5 && (string)p.Props[0] == name) return Convert.ToInt32(p.Props[4]);
        return def;
    }
    static double Dbl(FbxNode p70, string name, double def)
    {
        if (p70 != null) foreach (var p in p70.Children)
                if (p.Props.Count >= 5 && (string)p.Props[0] == name) return Convert.ToDouble(p.Props[4]);
        return def;
    }

    void Build(FbxNode root)
    {
        var gs = root.Child("GlobalSettings");
        var gp = gs != null ? gs.Child("Properties70") : null;
        UpAxis = Int(gp, "UpAxis", 1); UpSign = Int(gp, "UpAxisSign", 1);
        FrontAxis = Int(gp, "FrontAxis", 2); FrontSign = Int(gp, "FrontAxisSign", 1);
        CoordAxis = Int(gp, "CoordAxis", 0); CoordSign = Int(gp, "CoordAxisSign", 1);
        UnitScale = Dbl(gp, "UnitScaleFactor", 1);
        var objs = root.Child("Objects");
        foreach (var o in objs.Children)
        {
            if (o.Name == "Geometry" && o.Props.Count >= 3 && (string)o.Props[2] == "Mesh")
            {
                var g = new FbxGeometry { Id = (long)o.Props[0], Name = CleanName((string)o.Props[1]) };
                var v = o.Child("Vertices"); var pv = o.Child("PolygonVertexIndex");
                if (v == null || pv == null) continue;
                g.Vertices = (double[])v.Props[0]; g.Polygons = (int[])pv.Props[0];
                Geometries[g.Id] = g;
            }
            else if (o.Name == "Model")
            {
                var m = new FbxModel { Id = (long)o.Props[0], Name = CleanName((string)o.Props[1]), Type = o.Props.Count > 2 ? (string)o.Props[2] : "" };
                var p = o.Child("Properties70");
                var T = Vec(p, "Lcl Translation", 0, 0, 0); var R = Vec(p, "Lcl Rotation", 0, 0, 0); var S = Vec(p, "Lcl Scaling", 1, 1, 1);
                var pre = Vec(p, "PreRotation", 0, 0, 0); var post = Vec(p, "PostRotation", 0, 0, 0);
                var roff = Vec(p, "RotationOffset", 0, 0, 0); var rp = Vec(p, "RotationPivot", 0, 0, 0);
                var soff = Vec(p, "ScalingOffset", 0, 0, 0); var sp = Vec(p, "ScalingPivot", 0, 0, 0);
                int order = Int(p, "RotationOrder", 0);
                var L = Mat.Translate(T[0], T[1], T[2]);
                L = Mat.Mul(L, Mat.Translate(roff[0], roff[1], roff[2]));
                L = Mat.Mul(L, Mat.Translate(rp[0], rp[1], rp[2]));
                L = Mat.Mul(L, Mat.Euler(pre, 0));
                L = Mat.Mul(L, Mat.Euler(R, order));
                L = Mat.Mul(L, Mat.Inverse(Mat.Euler(post, 0)));
                L = Mat.Mul(L, Mat.Translate(-rp[0], -rp[1], -rp[2]));
                L = Mat.Mul(L, Mat.Translate(soff[0], soff[1], soff[2]));
                L = Mat.Mul(L, Mat.Translate(sp[0], sp[1], sp[2]));
                L = Mat.Mul(L, Mat.Scale(S[0], S[1], S[2]));
                L = Mat.Mul(L, Mat.Translate(-sp[0], -sp[1], -sp[2]));
                m.Local = L;
                var gt = Vec(p, "GeometricTranslation", 0, 0, 0); var gr = Vec(p, "GeometricRotation", 0, 0, 0); var gsc = Vec(p, "GeometricScaling", 1, 1, 1);
                m.Geo = Mat.Mul(Mat.Translate(gt[0], gt[1], gt[2]), Mat.Mul(Mat.Euler(gr, 0), Mat.Scale(gsc[0], gsc[1], gsc[2])));
                Models[m.Id] = m;
            }
        }
        var con = root.Child("Connections");
        if (con != null) foreach (var c in con.Children)
            {
                if (c.Name != "C" || c.Props.Count < 3 || (string)c.Props[0] != "OO") continue;
                long child = (long)c.Props[1], parent = (long)c.Props[2];
                FbxModel cm, pm;
                if (Models.TryGetValue(child, out cm)) { if (Models.TryGetValue(parent, out pm)) cm.Parent = pm; }
                else if (Geometries.ContainsKey(child) && Models.TryGetValue(parent, out pm)) pm.GeometryId = child;
            }
    }

    // maillage d'un modele dans le repere global du fichier (triangles en eventail ;
    // l'ordre des sommets est inverse si la transformation est un miroir)
    public Mesh WorldMesh(FbxModel m)
    {
        FbxGeometry g;
        if (m.GeometryId < 0 || !Geometries.TryGetValue(m.GeometryId, out g)) return null;
        var W = Mat.Mul(m.World(), m.Geo);
        bool flip = Mat.Det3(W) < 0;
        var mesh = new Mesh();
        var v = g.Vertices;
        for (int i = 0; i + 2 < v.Length; i += 3)
        {
            double x, y, z;
            Mat.Apply(W, v[i], v[i + 1], v[i + 2], out x, out y, out z);
            mesh.P.Add(x); mesh.P.Add(y); mesh.P.Add(z);
        }
        var poly = new List<int>();
        foreach (int raw in g.Polygons)
        {
            bool last = raw < 0;
            poly.Add(last ? ~raw : raw);
            if (!last) continue;
            for (int k = 1; k + 1 < poly.Count; k++)
            {
                if (flip) { mesh.T.Add(poly[0]); mesh.T.Add(poly[k + 1]); mesh.T.Add(poly[k]); }
                else { mesh.T.Add(poly[0]); mesh.T.Add(poly[k]); mesh.T.Add(poly[k + 1]); }
            }
            poly.Clear();
        }
        return mesh;
    }

    // inventaire lisible : nom ; type ; parent ; triangles ; boite englobante globale
    public string Dump()
    {
        var sb = new StringBuilder();
        sb.AppendLine(string.Format(CultureInfo.InvariantCulture, "version={0} up={1}{2} front={3}{4} coord={5}{6} unit={7}",
            Version, UpAxis, UpSign, FrontAxis, FrontSign, CoordAxis, CoordSign, UnitScale));
        foreach (var m in Models.Values)
        {
            var mesh = WorldMesh(m);
            string box = "";
            if (mesh != null && mesh.VertexCount > 0)
            {
                double[] mn = { double.MaxValue, double.MaxValue, double.MaxValue }, mx = { double.MinValue, double.MinValue, double.MinValue };
                for (int i = 0; i < mesh.P.Count; i += 3) for (int k = 0; k < 3; k++) { mn[k] = Math.Min(mn[k], mesh.P[i + k]); mx[k] = Math.Max(mx[k], mesh.P[i + k]); }
                box = string.Format(CultureInfo.InvariantCulture, "{0:F4},{1:F4},{2:F4} .. {3:F4},{4:F4},{5:F4}", mn[0], mn[1], mn[2], mx[0], mx[1], mx[2]);
            }
            sb.AppendLine(string.Format(CultureInfo.InvariantCulture, "{0};{1};{2};{3};{4}", m.Name, m.Type,
                m.Parent != null ? m.Parent.Name : "", mesh != null ? mesh.TriCount : 0, box));
        }
        return sb.ToString();
    }
}
