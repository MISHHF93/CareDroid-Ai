import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";

export default function DiagnosticTest() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    const results = [];

    // Test 1: Check if API client is loaded
    try {
      const { api } = await import("@/api/apiClient");
      results.push({
        name: "API Client Import",
        status: api ? "pass" : "fail",
        message: api ? "API client loaded successfully" : "API client is undefined"
      });
    } catch (error) {
      results.push({
        name: "API Client Import",
        status: "error",
        message: error.message
      });
    }

    // Test 2: Check mock data
    try {
      const { mockData } = await import("@/api/mockData");
      results.push({
        name: "Mock Data Import",
        status: mockData ? "pass" : "fail",
        message: mockData ? `Mock data loaded with ${Object.keys(mockData).length} collections` : "Mock data is undefined"
      });
    } catch (error) {
      results.push({
        name: "Mock Data Import",
        status: "error",
        message: error.message
      });
    }

    // Test 3: Check services utility
    try {
      const { entities } = await import("@/utils/services");
      results.push({
        name: "Services Utility Import",
        status: entities ? "pass" : "fail",
        message: entities ? "Services utility loaded" : "Services utility is undefined"
      });
    } catch (error) {
      results.push({
        name: "Services Utility Import",
        status: "error",
        message: error.message
      });
    }

    // Test 4: Test API entity listing
    try {
      const { api } = await import("@/api/apiClient");
      const drugs = await api.entities.Drug.list();
      results.push({
        name: "Drug Entity List",
        status: "pass",
        message: `Loaded ${drugs.length} drugs`
      });
    } catch (error) {
      results.push({
        name: "Drug Entity List",
        status: "error",
        message: error.message
      });
    }

    // Test 5: Test Protocol Entity
    try {
      const { api } = await import("@/api/apiClient");
      const protocols = await api.entities.Protocol.list();
      results.push({
        name: "Protocol Entity List",
        status: "pass",
        message: `Loaded ${protocols.length} protocols`
      });
    } catch (error) {
      results.push({
        name: "Protocol Entity List",
        status: "error",
        message: error.message
      });
    }

    // Test 6: Test LabValue Entity
    try {
      const { api } = await import("@/api/apiClient");
      const labValues = await api.entities.LabValue.list();
      results.push({
        name: "LabValue Entity List",
        status: "pass",
        message: `Loaded ${labValues.length} lab values`
      });
    } catch (error) {
      results.push({
        name: "LabValue Entity List",
        status: "error",
        message: error.message
      });
    }

    // Test 7: Test UI Components
    try {
      const { Card } = await import("@/components/ui/card");
      const { Button } = await import("@/components/ui/button");
      results.push({
        name: "UI Components",
        status: Card && Button ? "pass" : "fail",
        message: Card && Button ? "Card and Button components loaded" : "Components missing"
      });
    } catch (error) {
      results.push({
        name: "UI Components",
        status: "error",
        message: error.message
      });
    }

    // Test 8: Test Router
    try {
      const { useLocation } = await import("react-router-dom");
      results.push({
        name: "React Router",
        status: useLocation ? "pass" : "fail",
        message: useLocation ? "React Router loaded" : "Router is undefined"
      });
    } catch (error) {
      results.push({
        name: "React Router",
        status: "error",
        message: error.message
      });
    }

    // Test 9: Test localStorage
    try {
      localStorage.setItem('diagnostic_test', 'success');
      const value = localStorage.getItem('diagnostic_test');
      localStorage.removeItem('diagnostic_test');
      results.push({
        name: "LocalStorage",
        status: value === 'success' ? "pass" : "fail",
        message: value === 'success' ? "LocalStorage working" : "LocalStorage failed"
      });
    } catch (error) {
      results.push({
        name: "LocalStorage",
        status: "error",
        message: error.message
      });
    }

    // Test 10: Test Auth
    try {
      const { api } = await import("@/api/apiClient");
      const user = await api.auth.me();
      results.push({
        name: "Auth Service",
        status: user ? "pass" : "fail",
        message: user ? `User: ${user.email}` : "No user found"
      });
    } catch (error) {
      results.push({
        name: "Auth Service",
        status: "error",
        message: error.message
      });
    }

    setTests(results);
    setLoading(false);
  };

  const getIcon = (status) => {
    if (status === "pass") return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (status === "error") return <XCircle className="w-5 h-5 text-red-500" />;
    return <AlertCircle className="w-5 h-5 text-amber-500" />;
  };

  const getStatusColor = (status) => {
    if (status === "pass") return "bg-green-50 border-green-200";
    if (status === "error") return "bg-red-50 border-red-200";
    return "bg-amber-50 border-amber-200";
  };

  const passCount = tests.filter(t => t.status === "pass").length;
  const totalCount = tests.length;

  return (
    <div className="min-h-full bg-neutral-50 pb-6">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <AlertCircle className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">System Diagnostics</h1>
            <p className="text-blue-100 text-sm">Testing app functionality</p>
          </div>
        </div>

        {!loading && (
          <div className="flex gap-2">
            <Badge className="bg-white text-blue-600">
              {passCount} / {totalCount} Tests Passed
            </Badge>
            <Badge className={passCount === totalCount ? "bg-green-500" : "bg-amber-500"}>
              {passCount === totalCount ? "All Systems Go" : "Issues Detected"}
            </Badge>
          </div>
        )}
      </div>

      <div className="px-4 -mt-4 space-y-3">
        {loading ? (
          <Card className="bg-white">
            <CardContent className="p-6 flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span className="text-neutral-600">Running diagnostics...</span>
            </CardContent>
          </Card>
        ) : (
          <>
            {tests.map((test, index) => (
              <Card key={index} className={`${getStatusColor(test.status)} border`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {getIcon(test.status)}
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-900 text-sm mb-1">
                        {test.name}
                      </h3>
                      <p className="text-xs text-neutral-600">{test.message}</p>
                    </div>
                    <Badge variant={test.status === "pass" ? "success" : "destructive"}>
                      {test.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
              <CardContent className="p-4">
                <h3 className="font-semibold text-neutral-900 text-sm mb-2">
                  ℹ️ Diagnostic Information
                </h3>
                <div className="text-xs text-neutral-600 space-y-1">
                  <p>• Frontend: React 18 + Vite</p>
                  <p>• Router: React Router v7</p>
                  <p>• State: React Query + LocalStorage</p>
                  <p>• API: Mock data client with optional OpenAI</p>
                  <p>• Components: Radix UI + Tailwind CSS</p>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={runDiagnostics} 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Re-run Diagnostics
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
