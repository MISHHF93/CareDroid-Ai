import React from 'react';

const AuthShell = ({ children }) => {
  return (
    <div className="auth-shell">
      <div className="auth-shell-info">
        <div className="auth-shell-title">
          CareDroid Clinical AI
        </div>
        <p className="auth-shell-subtitle">
          A premium clinical AI workspace for fast, structured guidance. Secure, compliant, and built for teams.
        </p>
        <div className="auth-shell-features">
          <div className="card-subtle auth-shell-feature">
            ⚡ Evidence‑based responses and clinical calculators
          </div>
          <div className="card-subtle auth-shell-feature">
            🔒 HIPAA‑ready workflow with auditability
          </div>
          <div className="card-subtle auth-shell-feature">
            🧠 Contextual tools surfaced inside chat
          </div>
        </div>
      </div>
      <div className="auth-shell-content">
        {children}
      </div>
    </div>
  );
};

export default AuthShell;
