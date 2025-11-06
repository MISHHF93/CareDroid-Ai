import Layout from "./Layout.jsx";
import RequireAuth from "../components/guards/RequireAuth.jsx";
import RequireVerification from "../components/guards/RequireVerification.jsx";
import RequireSubscription from "../components/guards/RequireSubscription.jsx";

import Home from "./Home";

import DrugDatabase from "./DrugDatabase";

import Calculators from "./Calculators";

import Search from "./Search";

import Library from "./Library";

import Profile from "./Profile";

import Protocols from "./Protocols";

import Emergency from "./Emergency";

import LabValues from "./LabValues";

import Procedures from "./Procedures";

import Images from "./Images";

import AuditLog from "./AuditLog";

import SavedQueries from "./SavedQueries";

import TechnicalSpec from "./TechnicalSpec";

import DrugInteractions from "./DrugInteractions";

import DifferentialDx from "./DifferentialDx";

import Algorithms from "./Algorithms";

import Abbreviations from "./Abbreviations";

import LabInterpreter from "./LabInterpreter";

import ScoringSystem from "./ScoringSystem";

import ClinicalPearls from "./ClinicalPearls";

import QuickReference from "./QuickReference";

import Welcome from "./Welcome";

import Login from "./Login";

import Onboarding from "./Onboarding";

import SubscriptionSelect from "./SubscriptionSelect";

import ComplianceCenter from "./ComplianceCenter";

import ProfileEnhanced from "./ProfileEnhanced";

import JSONViewer from "./JSONViewer";

import Setup2FA from "./Setup2FA";

import InstitutionalPortal from "./InstitutionalPortal";

import LabImageAnalyzer from "./LabImageAnalyzer";

import AlgorithmAI from "./AlgorithmAI";

import ClinicalTrials from "./ClinicalTrials";

import OfflineManager from "./OfflineManager";

import EncounterSummary from "./EncounterSummary";

import DiagnosticTest from "./DiagnosticTest";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Home: Home,
    
    DrugDatabase: DrugDatabase,
    
    Calculators: Calculators,
    
    Search: Search,
    
    Library: Library,
    
    Profile: Profile,
    
    Protocols: Protocols,
    
    Emergency: Emergency,
    
    LabValues: LabValues,
    
    Procedures: Procedures,
    
    Images: Images,
    
    AuditLog: AuditLog,
    
    SavedQueries: SavedQueries,
    
    TechnicalSpec: TechnicalSpec,
    
    DrugInteractions: DrugInteractions,
    
    DifferentialDx: DifferentialDx,
    
    Algorithms: Algorithms,
    
    Abbreviations: Abbreviations,
    
    LabInterpreter: LabInterpreter,
    
    ScoringSystem: ScoringSystem,
    
    ClinicalPearls: ClinicalPearls,
    
    QuickReference: QuickReference,
    
    Welcome: Welcome,
    
    Login: Login,
    
    Onboarding: Onboarding,
    
    SubscriptionSelect: SubscriptionSelect,
    
    ComplianceCenter: ComplianceCenter,
    
    ProfileEnhanced: ProfileEnhanced,
    
    JSONViewer: JSONViewer,
    
    Setup2FA: Setup2FA,
    
    InstitutionalPortal: InstitutionalPortal,
    
    LabImageAnalyzer: LabImageAnalyzer,
    
    AlgorithmAI: AlgorithmAI,
    
    ClinicalTrials: ClinicalTrials,
    
    EncounterSummary: EncounterSummary,
    
    DiagnosticTest: DiagnosticTest,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                {/* Public routes - no authentication required */}
                <Route path="/" element={<Welcome />} />
                <Route path="/Welcome" element={<Welcome />} />
                <Route path="/Login" element={<Login />} />
                <Route path="/Onboarding" element={<Onboarding />} />
                <Route path="/SubscriptionSelect" element={<SubscriptionSelect />} />
                
                {/* Auth required routes */}
                <Route path="/Home" element={<RequireAuth><Home /></RequireAuth>} />
                <Route path="/DrugDatabase" element={<RequireAuth><DrugDatabase /></RequireAuth>} />
                <Route path="/Calculators" element={<RequireAuth><Calculators /></RequireAuth>} />
                <Route path="/Search" element={<RequireAuth><Search /></RequireAuth>} />
                <Route path="/Library" element={<RequireAuth><Library /></RequireAuth>} />
                <Route path="/Protocols" element={<RequireAuth><Protocols /></RequireAuth>} />
                <Route path="/Emergency" element={<RequireAuth><Emergency /></RequireAuth>} />
                <Route path="/LabValues" element={<RequireAuth><LabValues /></RequireAuth>} />
                <Route path="/Procedures" element={<RequireAuth><Procedures /></RequireAuth>} />
                <Route path="/Images" element={<RequireAuth><Images /></RequireAuth>} />
                <Route path="/SavedQueries" element={<RequireAuth><SavedQueries /></RequireAuth>} />
                <Route path="/TechnicalSpec" element={<RequireAuth><TechnicalSpec /></RequireAuth>} />
                <Route path="/DrugInteractions" element={<RequireAuth><DrugInteractions /></RequireAuth>} />
                <Route path="/Algorithms" element={<RequireAuth><Algorithms /></RequireAuth>} />
                <Route path="/Abbreviations" element={<RequireAuth><Abbreviations /></RequireAuth>} />
                <Route path="/ScoringSystem" element={<RequireAuth><ScoringSystem /></RequireAuth>} />
                <Route path="/ClinicalPearls" element={<RequireAuth><ClinicalPearls /></RequireAuth>} />
                <Route path="/QuickReference" element={<RequireAuth><QuickReference /></RequireAuth>} />
                <Route path="/JSONViewer" element={<RequireAuth><JSONViewer /></RequireAuth>} />
                <Route path="/OfflineManager" element={<RequireAuth><OfflineManager /></RequireAuth>} />
                <Route path="/EncounterSummary" element={<RequireAuth><EncounterSummary /></RequireAuth>} />
                <Route path="/DiagnosticTest" element={<RequireAuth><DiagnosticTest /></RequireAuth>} />
                
                {/* Auth + verification required routes */}
                <Route path="/Profile" element={<RequireVerification><Profile /></RequireVerification>} />
                <Route path="/ProfileEnhanced" element={<RequireVerification><ProfileEnhanced /></RequireVerification>} />
                <Route path="/Setup2FA" element={<RequireVerification><Setup2FA /></RequireVerification>} />
                <Route path="/ComplianceCenter" element={<RequireVerification><ComplianceCenter /></RequireVerification>} />
                
                {/* Premium routes - Auth + verification + subscription required */}
                <Route path="/AlgorithmAI" element={<RequireSubscription><AlgorithmAI /></RequireSubscription>} />
                <Route path="/LabInterpreter" element={<RequireSubscription><LabInterpreter /></RequireSubscription>} />
                <Route path="/DifferentialDx" element={<RequireSubscription><DifferentialDx /></RequireSubscription>} />
                <Route path="/ClinicalTrials" element={<RequireSubscription><ClinicalTrials /></RequireSubscription>} />
                <Route path="/LabImageAnalyzer" element={<RequireSubscription><LabImageAnalyzer /></RequireSubscription>} />
                <Route path="/InstitutionalPortal" element={<RequireSubscription tier="INSTITUTIONAL"><InstitutionalPortal /></RequireSubscription>} />
                <Route path="/AuditLog" element={<RequireSubscription tier="INSTITUTIONAL"><AuditLog /></RequireSubscription>} />
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}