/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "../lib/firebase";
import { X, Mail, Lock, Shield, AlertCircle, Compass, CheckCircle } from "lucide-react";

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured || !auth) {
      setError("Firebase has not been provisioned yet. Please accept terms on the setup card to populate credentials.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      onSuccess();
    } catch (err: any) {
      console.error("Auth error:", err);
      let msg = err.message || "Authentication failed.";
      if (err.code === "auth/user-not-found") {
        msg = "No user found with this email. Please click register to create a new profile.";
      } else if (err.code === "auth/wrong-password") {
        msg = "The password entered is incorrect.";
      } else if (err.code === "auth/email-already-in-use") {
        msg = "This email is already registered.";
      } else if (err.code === "auth/weak-password") {
        msg = "Password must be at least 6 characters long.";
      } else if (err.code === "auth/configuration-not-found") {
        msg = "This login method requires console activation. Please verify your settings.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      setError("Firebase setup is required (accept terms in the AI Studio card to connect and trigger Google credentials).");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signInWithPopup(auth, googleProvider);
      onSuccess();
    } catch (err: any) {
      console.error("Google auth error:", err);
      let msg = err.message || "Google authentication failed.";
      if (err.code === "auth/popup-closed-by-user") {
        msg = "Authentication request canceled.";
      } else if (err.code === "auth/unauthorized-domain") {
        msg = "This domain is not authorized in firebase hosting console.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div 
        id="mms-auth-pane" 
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#2A2035] bg-[#0B0B10] shadow-[0_0_50px_rgba(132,87,168,0.15)] text-white"
      >
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-[#8457A8]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8D7FA1] hover:text-white transition p-1.5 hover:bg-[#12121A] rounded-lg"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="text-center space-y-2 mt-2">
            <div className="inline-flex items-center gap-1 bg-[#4D2268]/25 text-[#C6BBD8] border border-[#2A2035] px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide">
              <Shield className="h-3 w-3 text-[#8457A8]" />
              <span>Prop Trading Verification</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mt-2">
              {isRegistering ? "Register New Account" : "Access Trading Terminal"}
            </h2>
            <p className="text-xs text-[#8D7FA1]">
              Connecting MMS workspace to absolute cloud persistent database.
            </p>
          </div>

          {!isFirebaseConfigured && (
            <div className="p-3.5 bg-[#4D2268]/20 border border-[#8457A8]/30 rounded-xl space-y-2 text-xs text-[#C6BBD8]">
              <div className="flex gap-2 font-bold text-[#8457A8] items-center">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Simulation Sandbox Active</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                We are currently running on a robust mock database wrapper because terms are not yet accepted on the setup card. Logins below are simulated with a virtual user to let you fully experience the workspace without delay!
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg flex gap-2 items-start">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[9px] uppercase font-bold text-[#8D7FA1]">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-[#8D7FA1]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-[#2A2035] bg-[#12121A] pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#8457A8] transition-colors"
                  placeholder="name@prop-firm.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[9px] uppercase font-bold text-[#8D7FA1]">Access Code Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-[#8D7FA1]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-[#2A2035] bg-[#12121A] pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#8457A8] transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#8457A8] py-2.5 text-sm font-bold text-white hover:bg-[#9367B6] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#4D2268]/20"
            >
              {loading ? (
                <span>Validating credentials...</span>
              ) : (
                <span>{isRegistering ? "Create Developer Account" : "Initialize Workspace Log"}</span>
              )}
            </button>
          </form>

          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#2A2035]" />
            </div>
            <span className="relative bg-[#0B0B10] px-3.5 text-[9px] font-black uppercase text-[#8D7FA1]">OR SIGN IN USING</span>
          </div>

          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full rounded-lg border border-[#2A2035] bg-[#12121A] py-2.5 text-xs font-bold text-white hover:bg-[#1C1C28] transition flex items-center justify-center gap-2"
          >
            {/* Google Brand Colored G Logo */}
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Authenticate with Google Core Setup</span>
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-[11px] font-semibold text-[#C6BBD8] hover:text-[#8457A8] transition hover:underline"
            >
              {isRegistering ? "Already have an account? Sign In" : "Need a professional identity? Register Here"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
