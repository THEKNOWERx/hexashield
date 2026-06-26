import os
import shutil

routes_map = {
    "LandingPage.jsx": "page.jsx",
    "Login.jsx": "login/page.jsx",
    "Register.jsx": "register/page.jsx",
    "Dashboard.jsx": "dashboard/page.jsx",
    "ReconView.jsx": "recon/page.jsx",
    "ScanView.jsx": "scan/page.jsx",
    "URLScannerView.jsx": "url-scan/page.jsx",
    "VulnAnalysisView.jsx": "vulnerabilities/page.jsx",
    "AttackPathView.jsx": "attack-path/page.jsx",
    "ReportGeneratorView.jsx": "reports/page.jsx",
    "ReportDetailView.jsx": "reports/[id]/page.jsx",
    "AIAssistantView.jsx": "ai-assistant/page.jsx",
    "ThemeCustomizerView.jsx": "settings/theme/page.jsx",
    "AboutFramework.jsx": "about/page.jsx",
    "AdminPanelView.jsx": "admin/page.jsx",
    # Nexus tabs
    "NexusIntelligenceView.jsx": "nexus/page.jsx", # I will handle the tabs differently or just route here
    "ScientificLabView.jsx": "scientific-lab/page.jsx",
    "ExploitationView.jsx": "exploitation/page.jsx"
}

source_dir = "src/pages"
dest_dir = "src/app"

for filename, dest_path in routes_map.items():
    src_file = os.path.join(source_dir, filename)
    if os.path.exists(src_file):
        dest_file = os.path.join(dest_dir, dest_path)
        os.makedirs(os.path.dirname(dest_file), exist_ok=True)
        shutil.move(src_file, dest_file)
        print(f"Moved {src_file} -> {dest_file}")
    else:
        print(f"Warning: {src_file} not found")
