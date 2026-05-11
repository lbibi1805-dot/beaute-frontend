/**
 * RegisterModal — username/password registration dialog.
 */
import { useState } from "react";
import { UserPlus } from "lucide-react";
import { useAuth } from "../../context/AuthContext.tsx";

interface RegisterModalProps {
  open: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export function RegisterModal({ open, onClose, onSwitchToLogin }: RegisterModalProps) {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await register(username.trim(), password);
      setUsername("");
      setPassword("");
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed.";
      setError(msg.includes("already taken") ? "Username already taken. Try another." : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-8">
        <div className="flex items-center gap-3 mb-6">
          <UserPlus className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Create account</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              autoComplete="new-password"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-xs text-gray-500 text-center">
          Already have an account?{" "}
          <button
            onClick={() => { onClose(); onSwitchToLogin(); }}
            className="text-gray-900 font-medium hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
