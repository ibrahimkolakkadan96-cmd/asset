using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

namespace ITAssetTracker
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            try
            {
                // App configuration
                string appUrl = "https://ais-dev-xforgejsk5lsa7ifzxhh3h-915843992498.europe-west2.run.app";
                string localDist = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "dist", "index.html");

                string targetUrl = appUrl;
                if (File.Exists(localDist))
                {
                    targetUrl = "file:///" + localDist.Replace('\\', '/');
                }

                // Check for Microsoft Edge or Chrome to run in standalone App window mode
                string[] browserPaths = new string[]
                {
                    Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe"),
                    Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe"),
                    Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\Chrome\Application\chrome.exe"),
                    Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe")
                };

                string foundBrowser = null;
                foreach (string p in browserPaths)
                {
                    if (File.Exists(p))
                    {
                        foundBrowser = p;
                        break;
                    }
                }

                string userDataDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "ITAssetTrackerApp");

                if (foundBrowser != null)
                {
                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = foundBrowser;
                    psi.Arguments = string.Format("--app=\"{0}\" --window-size=1440,900 --user-data-dir=\"{1}\" --enable-features=OverlayScrollbar", targetUrl, userDataDir);
                    psi.UseShellExecute = false;
                    Process.Start(psi);
                }
                else
                {
                    // Fallback to default browser
                    Process.Start(targetUrl);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Error launching IT Asset Tracker: " + ex.Message, "IT Asset Tracker", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
