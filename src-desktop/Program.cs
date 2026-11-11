using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace Vaulty;

static class Program
{
    [STAThread]
    static void Main()
    {
        AppDomain.CurrentDomain.UnhandledException += (s, e) =>
        {
            LogCrash(e.ExceptionObject?.ToString());
        };
        Application.ThreadException += (s, e) =>
        {
            LogCrash(e.Exception?.ToString());
        };

        try
        {
            ApplicationConfiguration.Initialize();
            Application.Run(new MainWindow());
        }
        catch (Exception ex)
        {
            LogCrash(ex.ToString());
            MessageBox.Show(ex.ToString(), "Vaulty Crash", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    public static void LogCrash(string? msg)
    {
        try
        {
            string p = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "vaulty-crash.log");
            File.AppendAllText(p, $"[{DateTime.Now}] {msg}\n\n");
        }
        catch { }
    }

    public static string GetSafeAppDataDir()
    {
        try
        {
            string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            if (!string.IsNullOrEmpty(appData))
            {
                string dir = Path.Combine(appData, "Vaulty");
                Directory.CreateDirectory(dir);
                string testFile = Path.Combine(dir, ".perm_test");
                File.WriteAllText(testFile, "ok");
                File.Delete(testFile);
                return dir;
            }
        }
        catch { }

        try
        {
            string localData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            if (!string.IsNullOrEmpty(localData))
            {
                string dir = Path.Combine(localData, "Vaulty");
                Directory.CreateDirectory(dir);
                string testFile = Path.Combine(dir, ".perm_test");
                File.WriteAllText(testFile, "ok");
                File.Delete(testFile);
                return dir;
            }
        }
        catch { }

        string fallback = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "VaultyData");
        Directory.CreateDirectory(fallback);
        return fallback;
    }
}

public class MainWindow : Form
{
    private readonly WebView2 _webView;
    private readonly string _appDataDir;
    private readonly string _jsonFilePath;
    private readonly string _webAssetsDir;
    private readonly Dictionary<string, string> _vaultData = new();
    private readonly object _saveLock = new();

    [DllImport("user32.dll")]
    private static extern bool ReleaseCapture();

    [DllImport("user32.dll")]
    private static extern int SendMessage(IntPtr hWnd, int Msg, int wParam, int lParam);

    [DllImport("dwmapi.dll")]
    private static extern int DwmSetWindowAttribute(IntPtr hwnd, int attr, ref int attrValue, int attrSize);

    private const int WM_NCLBUTTONDOWN = 0xA1;
    private const int HTCAPTION = 0x2;
    private const int DWMWA_WINDOW_CORNER_PREFERENCE = 33;
    private const int DWMWCP_ROUND = 2; // DWM native subtle rounded corners

    public MainWindow()
    {
        Text = "Vaulty v1.6.0";
        MinimumSize = new Size(1100, 720);
        MaximumSize = Size.Empty;
        Size = new Size(1920, 1080);
        StartPosition = FormStartPosition.CenterScreen;
        FormBorderStyle = FormBorderStyle.None;
        DoubleBuffered = true;

        HandleCreated += (_, _) =>
        {
            try
            {
                int preference = DWMWCP_ROUND;
                DwmSetWindowAttribute(Handle, DWMWA_WINDOW_CORNER_PREFERENCE, ref preference, sizeof(int));
            }
            catch { }
        };

        Load += (_, _) =>
        {
            try
            {
                var screen = Screen.PrimaryScreen ?? Screen.FromControl(this);
                var workingArea = screen.WorkingArea;
                int w = Math.Min(Width, workingArea.Width);
                int h = Math.Min(Height, workingArea.Height);
                Size = new Size(w, h);
                int x = workingArea.Left + Math.Max(0, (workingArea.Width - Width) / 2);
                int y = workingArea.Top + Math.Max(0, (workingArea.Height - Height) / 2);
                Location = new Point(x, y);
            }
            catch { }
        };

        Resize += (_, _) =>
        {
            try
            {
                if (_webView?.CoreWebView2 != null)
                {
                    bool isMax = WindowState == FormWindowState.Maximized;
                    _webView.CoreWebView2.ExecuteScriptAsync($"document.body.classList.toggle('is-maximized', {isMax.ToString().ToLowerInvariant()});");
                }
            }
            catch { }
        };

        // Set Icon
        try
        {
            string icoPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "assets", "app-icon.ico");
            if (File.Exists(icoPath))
            {
                Icon = new Icon(icoPath);
            }
            else
            {
                var asm = Assembly.GetExecutingAssembly();
                using var stream = asm.GetManifestResourceStream("WebAssets.assets.app-icon.ico");
                if (stream != null)
                {
                    Icon = new Icon(stream);
                }
            }
        }
        catch { }

        // Setup paths in %APPDATA%\Vaulty (with graceful permission fallback)
        _appDataDir = Program.GetSafeAppDataDir();
        _jsonFilePath = Path.Combine(_appDataDir, "vault.json");
        _webAssetsDir = Path.Combine(_appDataDir, "WebAssets");
        Directory.CreateDirectory(_webAssetsDir);

        // Load existing vault.json if present
        LoadVaultJson();

        // Create WebView2
        _webView = new WebView2
        {
            Dock = DockStyle.Fill,
            DefaultBackgroundColor = Color.FromArgb(248, 250, 252) // #F8FAFC
        };
        Controls.Add(_webView);

        // Initialize WebView2
        Load += async (_, _) => await InitializeWebViewAsync();
    }

    private void LoadVaultJson()
    {
        if (!File.Exists(_jsonFilePath)) return;
        try
        {
            string raw = File.ReadAllText(_jsonFilePath);
            string jsonToParse = raw;
            bool wasEncrypted = false;

            // 1. Check if the file is stored in an encrypted envelope { "vault_encrypted": true, "payload": "..." }
            try
            {
                using var envelopeDoc = JsonDocument.Parse(raw);
                if (envelopeDoc.RootElement.TryGetProperty("vault_encrypted", out var isEnc) && isEnc.GetBoolean())
                {
                    if (envelopeDoc.RootElement.TryGetProperty("payload", out var payloadElem))
                    {
                        string encPayload = payloadElem.GetString() ?? "";
                        if (VaultEncryption.TryDecrypt(encPayload, _appDataDir, out string decryptedJson))
                        {
                            jsonToParse = decryptedJson;
                            wasEncrypted = true;
                        }
                        else
                        {
                            Program.LogCrash("Could not decrypt vault payload with AES-256-GCM.");
                            return;
                        }
                    }
                }
            }
            catch
            {
                // 2. Might be a raw encrypted string directly
                if (VaultEncryption.TryDecrypt(raw, _appDataDir, out string decryptedRaw))
                {
                    jsonToParse = decryptedRaw;
                    wasEncrypted = true;
                }
            }

            using var doc = JsonDocument.Parse(jsonToParse);
            foreach (var prop in doc.RootElement.EnumerateObject())
            {
                _vaultData[prop.Name] = prop.Value.ValueKind == JsonValueKind.String 
                    ? prop.Value.GetString()! 
                    : prop.Value.GetRawText();
            }

            // Automatic migration: If existing file was plaintext legacy, encrypt it immediately!
            if (!wasEncrypted)
            {
                SaveVaultJson();
            }
        }
        catch (Exception ex)
        {
            Program.LogCrash($"Failed to load vault.json: {ex}");
        }
    }

    private void SaveVaultJson()
    {
        lock (_saveLock)
        {
            try
            {
                var root = new Dictionary<string, object>();
                foreach (var (k, v) in _vaultData)
                {
                    try
                    {
                        using var doc = JsonDocument.Parse(v);
                        root[k] = JsonSerializer.Deserialize<JsonElement>(v);
                    }
                    catch
                    {
                        root[k] = v;
                    }
                }

                var options = new JsonSerializerOptions { WriteIndented = false };
                string rawJson = JsonSerializer.Serialize(root, options);

                // High-security AES-256-GCM encryption at rest
                string encryptedData = VaultEncryption.Encrypt(rawJson, _appDataDir);

                var envelope = new
                {
                    vault_encrypted = true,
                    algorithm = "AES-256-GCM",
                    key_protection = "DPAPI-SHA256",
                    version = "1.6.0",
                    updated_at = DateTime.UtcNow.ToString("o"),
                    payload = encryptedData
                };

                string envelopeJson = JsonSerializer.Serialize(envelope, new JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(_jsonFilePath, envelopeJson);
            }
            catch (Exception ex)
            {
                Program.LogCrash($"Failed to save encrypted vault.json: {ex}");
            }
        }
    }

    private async Task InitializeWebViewAsync()
    {
        try
        {
            // Extract embedded resources to _webAssetsDir
            ExtractWebAssets();

            // Setup WebView2 Environment with persistent profile in %APPDATA%\Vaulty\WebView2Data
            string userDataFolder = Path.Combine(_appDataDir, "WebView2Data");
            Directory.CreateDirectory(userDataFolder);

            var env = await CoreWebView2Environment.CreateAsync(null, userDataFolder);
            await _webView.EnsureCoreWebView2Async(env);

            var settings = _webView.CoreWebView2.Settings;
            settings.AreDevToolsEnabled = true;
            settings.IsStatusBarEnabled = false;
            settings.AreDefaultContextMenusEnabled = true;
            settings.IsPasswordAutosaveEnabled = false;
            settings.IsGeneralAutofillEnabled = false;

            // Map virtual host to the WebAssets folder
            _webView.CoreWebView2.SetVirtualHostNameToFolderMapping(
                "app.vaulty.local",
                _webAssetsDir,
                CoreWebView2HostResourceAccessKind.Allow
            );

            // Pre-inject initial vault JSON data if available
            string initialDataJson = JsonSerializer.Serialize(_vaultData);
            await _webView.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync(
                $"window.__INITIAL_VAULT_DATA__ = {initialDataJson};"
            );

            // Listen for window management and storage sync messages
            _webView.CoreWebView2.WebMessageReceived += OnWebMessageReceived;

            // Navigate to login
            _webView.CoreWebView2.Navigate("https://app.vaulty.local/index.html");
        }
        catch (Exception ex)
        {
            Program.LogCrash("InitializeWebViewAsync failed: " + ex);
            MessageBox.Show($"Vaulty başlatılırken bir hata oluştu:\n{ex.Message}", "Hata", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    private void OnWebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        try
        {
            using var doc = JsonDocument.Parse(e.WebMessageAsJson);
            var root = doc.RootElement;
            string action = root.GetProperty("action").GetString() ?? "";

            switch (action)
            {
                case "minimize":
                    Invoke(() => WindowState = FormWindowState.Minimized);
                    break;
                case "maximize":
                    Invoke(() => WindowState = WindowState == FormWindowState.Maximized ? FormWindowState.Normal : FormWindowState.Maximized);
                    break;
                case "close":
                    Invoke(Close);
                    break;
                case "dragWindow":
                    Invoke(() =>
                    {
                        ReleaseCapture();
                        SendMessage(Handle, WM_NCLBUTTONDOWN, HTCAPTION, 0);
                    });
                    break;
                case "resizeWindow":
                    if (WindowState == FormWindowState.Normal)
                    {
                        string direction = root.GetProperty("direction").GetString() ?? "";
                        int ht = direction switch
                        {
                            "top" => 12,
                            "bottom" => 15,
                            "left" => 10,
                            "right" => 11,
                            "top-left" => 13,
                            "top-right" => 14,
                            "bottom-left" => 16,
                            "bottom-right" => 17,
                            _ => 0
                        };
                        if (ht != 0)
                        {
                            Invoke(() =>
                            {
                                ReleaseCapture();
                                SendMessage(Handle, WM_NCLBUTTONDOWN, ht, 0);
                            });
                        }
                    }
                    break;
                case "storageSet":
                    string key = root.GetProperty("key").GetString() ?? "";
                    string value = root.GetProperty("value").GetString() ?? "";
                    if (!string.IsNullOrEmpty(key))
                    {
                        _vaultData[key] = value;
                        SaveVaultJson();
                    }
                    break;
                case "storageRemove":
                    string remKey = root.GetProperty("key").GetString() ?? "";
                    if (!string.IsNullOrEmpty(remKey))
                    {
                        _vaultData.Remove(remKey);
                        SaveVaultJson();
                    }
                    break;
            }
        }
        catch (Exception ex)
        {
            Program.LogCrash($"Error processing web message: {ex}");
        }
    }

    private void ExtractWebAssets()
    {
        var asm = Assembly.GetExecutingAssembly();
        string prefix = "WebAssets.";

        foreach (string resName in asm.GetManifestResourceNames())
        {
            if (!resName.StartsWith(prefix)) continue;
            string rel = resName.Substring(prefix.Length);

            string targetPath;
            if (rel.StartsWith("assets."))
            {
                string filename = rel.Substring("assets.".Length);
                targetPath = Path.Combine(_webAssetsDir, "assets", filename);
            }
            else if (rel.StartsWith("core."))
            {
                string filename = rel.Substring("core.".Length);
                targetPath = Path.Combine(_webAssetsDir, "core", filename);
            }
            else if (rel.StartsWith("modals."))
            {
                string filename = rel.Substring("modals.".Length);
                targetPath = Path.Combine(_webAssetsDir, "modals", filename);
            }
            else if (rel.StartsWith("views."))
            {
                string filename = rel.Substring("views.".Length);
                targetPath = Path.Combine(_webAssetsDir, "views", filename);
            }
            else if (rel.StartsWith("components.sidebar."))
            {
                string filename = rel.Substring("components.sidebar.".Length);
                targetPath = Path.Combine(_webAssetsDir, "components", "sidebar", filename);
            }
            else if (rel.StartsWith("components.cards."))
            {
                string filename = rel.Substring("components.cards.".Length);
                targetPath = Path.Combine(_webAssetsDir, "components", "cards", filename);
            }
            else if (rel.StartsWith("components.charts."))
            {
                string filename = rel.Substring("components.charts.".Length);
                targetPath = Path.Combine(_webAssetsDir, "components", "charts", filename);
            }
            else if (rel.StartsWith("components.tables."))
            {
                string filename = rel.Substring("components.tables.".Length);
                targetPath = Path.Combine(_webAssetsDir, "components", "tables", filename);
            }
            else if (rel.StartsWith("components.recurring."))
            {
                string filename = rel.Substring("components.recurring.".Length);
                targetPath = Path.Combine(_webAssetsDir, "components", "recurring", filename);
            }
            else if (rel.Contains("/"))
            {
                targetPath = Path.Combine(_webAssetsDir, rel.Replace('/', Path.DirectorySeparatorChar));
            }
            else
            {
                targetPath = Path.Combine(_webAssetsDir, rel);
            }

            Directory.CreateDirectory(Path.GetDirectoryName(targetPath)!);

            using var inStream = asm.GetManifestResourceStream(resName);
            if (inStream == null) continue;

            using var outStream = File.Create(targetPath);
            inStream.CopyTo(outStream);
        }

        // Also if running alongside local workspace files, copy them over if present
        string baseDir = AppDomain.CurrentDomain.BaseDirectory;
        string[] directFiles = { "index.html", "dashboard.html", "styles.css", "shell.css", "app.js", "storage.js", "shell.js", "dashboard.js", "main.js" };
        foreach (var file in directFiles)
        {
            string localSrc = Path.Combine(baseDir, file);
            if (File.Exists(localSrc))
            {
                File.Copy(localSrc, Path.Combine(_webAssetsDir, file), true);
            }
        }

        string[] subDirs = { "core", "components", "views", "modals", "assets" };
        foreach (var dir in subDirs)
        {
            string localDir = Path.Combine(baseDir, dir);
            if (Directory.Exists(localDir))
            {
                CopyDirectoryRecursive(localDir, Path.Combine(_webAssetsDir, dir));
            }
        }
    }

    private static void CopyDirectoryRecursive(string sourceDir, string targetDir)
    {
        Directory.CreateDirectory(targetDir);
        foreach (string file in Directory.GetFiles(sourceDir))
        {
            File.Copy(file, Path.Combine(targetDir, Path.GetFileName(file)), true);
        }
        foreach (string subDir in Directory.GetDirectories(sourceDir))
        {
            CopyDirectoryRecursive(subDir, Path.Combine(targetDir, Path.GetFileName(subDir)));
        }
    }

    // Frameless window border resizing (6px perimeter hit-testing)
    protected override void WndProc(ref Message m)
    {
        const int WM_NCHITTEST = 0x84;
        const int HTCLIENT = 1;
        const int HTLEFT = 10;
        const int HTRIGHT = 11;
        const int HTTOP = 12;
        const int HTTOPLEFT = 13;
        const int HTTOPRIGHT = 14;
        const int HTBOTTOM = 15;
        const int HTBOTTOMLEFT = 16;
        const int HTBOTTOMRIGHT = 17;

        if (m.Msg == WM_NCHITTEST && WindowState == FormWindowState.Normal)
        {
            base.WndProc(ref m);
            if ((int)m.Result == HTCLIENT)
            {
                long lparam = m.LParam.ToInt64();
                short screenX = (short)(lparam & 0xFFFF);
                short screenY = (short)((lparam >> 16) & 0xFFFF);
                Point pt = PointToClient(new Point(screenX, screenY));
                int border = 6;
                bool left = pt.X <= border;
                bool right = pt.X >= ClientSize.Width - border;
                bool top = pt.Y <= border;
                bool bottom = pt.Y >= ClientSize.Height - border;

                if (top && left) { m.Result = (IntPtr)HTTOPLEFT; return; }
                if (top && right) { m.Result = (IntPtr)HTTOPRIGHT; return; }
                if (bottom && left) { m.Result = (IntPtr)HTBOTTOMLEFT; return; }
                if (bottom && right) { m.Result = (IntPtr)HTBOTTOMRIGHT; return; }
                if (left) { m.Result = (IntPtr)HTLEFT; return; }
                if (right) { m.Result = (IntPtr)HTRIGHT; return; }
                if (top) { m.Result = (IntPtr)HTTOP; return; }
                if (bottom) { m.Result = (IntPtr)HTBOTTOM; return; }
            }
            return;
        }

        base.WndProc(ref m);
    }
}

public static class VaultEncryption
{
    private const string MagicPrefix = "VAULTY_AES256_GCM_V1:";
    private const int NonceSize = 12; // 96-bit nonce for GCM
    private const int TagSize = 16;   // 128-bit authentication tag for GCM
    private const int KeySize = 32;   // 256-bit key for AES-256

    private static byte[]? _cachedKey;
    private static readonly object _keyLock = new();

    public static byte[] GetOrCreateMasterKey(string appDataDir)
    {
        lock (_keyLock)
        {
            if (_cachedKey != null) return _cachedKey;

            string keyFilePath = Path.Combine(appDataDir, "vault.key");
            byte[] entropy = GetMachineEntropy();

            if (File.Exists(keyFilePath))
            {
                try
                {
                    byte[] protectedBytes = File.ReadAllBytes(keyFilePath);
                    byte[] rawKey = ProtectedData.Unprotect(protectedBytes, entropy, DataProtectionScope.CurrentUser);
                    if (rawKey != null && rawKey.Length == KeySize)
                    {
                        _cachedKey = rawKey;
                        return _cachedKey;
                    }
                }
                catch (Exception ex)
                {
                    Program.LogCrash($"ProtectedData.Unprotect warning: {ex.Message}");
                }
            }

            // Generate a fresh cryptographically secure 256-bit random key
            byte[] newKey = new byte[KeySize];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(newKey);
            }

            try
            {
                byte[] protectedBytes = ProtectedData.Protect(newKey, entropy, DataProtectionScope.CurrentUser);
                File.WriteAllBytes(keyFilePath, protectedBytes);
            }
            catch (Exception ex)
            {
                Program.LogCrash($"ProtectedData.Protect warning: {ex.Message}. Falling back to derived machine key.");
                using var kdf = new Rfc2898DeriveBytes(entropy, new byte[] { 0x56, 0x61, 0x75, 0x6C, 0x74, 0x79, 0x53, 0x61, 0x6C, 0x74, 0x32, 0x30, 0x32, 0x36, 0x21, 0x21 }, 100000, HashAlgorithmName.SHA256);
                newKey = kdf.GetBytes(KeySize);
            }

            _cachedKey = newKey;
            return _cachedKey;
        }
    }

    private static byte[] GetMachineEntropy()
    {
        try
        {
            string machineInfo = $"{Environment.MachineName}|{Environment.UserName}|{Environment.OSVersion}|VaultyAES256MasterKey2026";
            using var sha = SHA256.Create();
            return sha.ComputeHash(Encoding.UTF8.GetBytes(machineInfo));
        }
        catch
        {
            return new byte[] { 0x56, 0x61, 0x75, 0x6C, 0x74, 0x79, 0x45, 0x6E, 0x74, 0x72, 0x6F, 0x70, 0x79, 0x31, 0x35, 0x31 };
        }
    }

    public static string Encrypt(string plaintext, string appDataDir)
    {
        if (string.IsNullOrEmpty(plaintext)) return string.Empty;

        byte[] key = GetOrCreateMasterKey(appDataDir);
        byte[] plaintextBytes = Encoding.UTF8.GetBytes(plaintext);

        byte[] nonce = new byte[NonceSize];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(nonce);
        }

        byte[] ciphertext = new byte[plaintextBytes.Length];
        byte[] tag = new byte[TagSize];

        using (var aesGcm = new AesGcm(key, TagSize))
        {
            aesGcm.Encrypt(nonce, plaintextBytes, ciphertext, tag);
        }

        byte[] combined = new byte[NonceSize + TagSize + ciphertext.Length];
        Buffer.BlockCopy(nonce, 0, combined, 0, NonceSize);
        Buffer.BlockCopy(tag, 0, combined, NonceSize, TagSize);
        Buffer.BlockCopy(ciphertext, 0, combined, NonceSize + TagSize, ciphertext.Length);

        return MagicPrefix + Convert.ToBase64String(combined);
    }

    public static bool TryDecrypt(string encryptedPayload, string appDataDir, out string decrypted)
    {
        decrypted = string.Empty;
        if (string.IsNullOrEmpty(encryptedPayload)) return false;

        string b64 = encryptedPayload.StartsWith(MagicPrefix) 
            ? encryptedPayload.Substring(MagicPrefix.Length) 
            : encryptedPayload;

        try
        {
            byte[] combined = Convert.FromBase64String(b64);
            if (combined.Length < NonceSize + TagSize) return false;

            byte[] nonce = new byte[NonceSize];
            byte[] tag = new byte[TagSize];
            int cipherLength = combined.Length - NonceSize - TagSize;
            byte[] ciphertext = new byte[cipherLength];

            Buffer.BlockCopy(combined, 0, nonce, 0, NonceSize);
            Buffer.BlockCopy(combined, NonceSize, tag, 0, TagSize);
            Buffer.BlockCopy(combined, NonceSize + TagSize, ciphertext, 0, cipherLength);

            byte[] plaintextBytes = new byte[cipherLength];
            byte[] key = GetOrCreateMasterKey(appDataDir);

            using (var aesGcm = new AesGcm(key, TagSize))
            {
                aesGcm.Decrypt(nonce, ciphertext, tag, plaintextBytes);
            }

            decrypted = Encoding.UTF8.GetString(plaintextBytes);
            return true;
        }
        catch (Exception ex)
        {
            Program.LogCrash($"TryDecrypt failed: {ex.Message}");
            return false;
        }
    }
}
