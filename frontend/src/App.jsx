import { useEffect, useState } from "react";
import { api } from "./api";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchTasks = async () => {
    try {
      const res = await api.get("/tasks");
      setTasks(res.data);
    } catch {}
  };

  useEffect(() => {
    fetchTasks();
    const i = setInterval(fetchTasks, 3000);
    return () => clearInterval(i);
  }, []);

  const uploadVideo = async () => {
    if (!file) return;
    const form = new FormData();
    form.append("video", file);
    try {
      setUploading(true);
      await api.post("/upload", form);
      setFile(null);
      fetchTasks();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden text-white">

      {/* 🌌 AURORA BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,255,255,0.12),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(0,255,150,0.12),transparent_40%),radial-gradient(circle_at_50%_50%,rgba(120,120,255,0.08),transparent_50%)] animate-pulse" />

      <div className="relative max-w-7xl mx-auto px-6 py-20 space-y-20">

        {/* 🚀 HERO */}
        <section className="text-center space-y-6">
          <h1 className="text-6xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-neon to-emerald-400 bg-clip-text text-transparent">
              VIDEO FORGE
            </span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Asynchronous video processing 
          </p>
        </section>

        {/* 📤 UPLOAD CORE */}
        <section className="relative group">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-neon via-cyan-400 to-emerald-400 blur opacity-40 group-hover:opacity-80 transition" />
          <div className="relative rounded-3xl bg-black/60 backdrop-blur-2xl border border-white/10 p-12">

            <h2 className="text-2xl font-semibold mb-8 text-center">
              Upload Video
            </h2>

            <label className="block cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl border border-dashed border-neon/50 p-16 text-center hover:bg-white/5 transition">

                {/* spotlight */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />

                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files[0])}
                />

                {!file ? (
                  <>
                    <div className="text-6xl mb-4">🎞️</div>
                    <p className="text-lg font-medium">
                      Drop your cinematic masterpiece
                    </p>
                    <p className="text-sm text-white/40 mt-2">
                      MP4 • MOV • WebM • up to 200MB
                    </p>
                  </>
                ) : (
                  <p className="font-mono text-neon break-all">
                    {file.name}
                  </p>
                )}
              </div>
            </label>

            <div className="flex justify-center mt-10">
              <button
                onClick={uploadVideo}
                disabled={!file || uploading}
                className="relative px-16 py-4 rounded-full font-black text-black
                           bg-gradient-to-r from-neon to-cyan-400
                           hover:scale-110 transition
                           disabled:opacity-40"
              >
                {uploading ? "FORGING VIDEO…" : "START FORGE"}
              </button>
            </div>
          </div>
        </section>

        {/* 🧠 TASKS */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold">Processing Timeline</h2>

          {tasks.length === 0 && (
            <p className="text-center text-white/50">
              No tasks yet. Upload a video to begin the forge.
            </p>
          )}

          <div className="space-y-6">
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ================= TASK CARD ================= */

function TaskCard({ task }) {
  const glow =
    task.state === "PROCESSING"
      ? "from-blue-500/40 to-cyan-400/40"
      : task.state === "COMPLETED"
      ? "from-green-500/40 to-emerald-400/40"
      : "from-yellow-400/30 to-orange-400/30";

  return (
    <div className="relative group">
      <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-r ${glow} blur opacity-50`} />
      <div className="relative rounded-2xl bg-black/70 backdrop-blur-xl border border-white/10 p-6">

        <div className="flex justify-between items-start">
          <div>
            <p className="font-mono text-xs text-white/40">
              {task.id.slice(0, 8)}…{task.id.slice(-4)}
            </p>
            <div className="flex gap-2 mt-2">
              <Tag>{task.format}</Tag>
              <Tag>{task.profile}</Tag>
            </div>
          </div>
          <StatusBadge state={task.state} />
        </div>

        <div className="mt-6">
          <EnergyBar state={task.state} />
        </div>

        {task.state === "COMPLETED" && (
          <div className="flex justify-end mt-6">
            <a
              href={`http://localhost:4000/download/${task.id}`}
              className="px-8 py-2 rounded-full bg-gradient-to-r from-neon to-emerald-400
                         text-black font-bold hover:scale-105 transition"
            >
              Download
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= ENERGY BAR ================= */

function EnergyBar({ state }) {
  const width =
    state === "QUEUED" ? "30%" :
    state === "PROCESSING" ? "65%" :
    state === "COMPLETED" ? "100%" : "0%";

  return (
    <div className="h-3 rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-cyan-400 to-neon animate-pulse"
        style={{ width }}
      />
    </div>
  );
}

/* ================= TAG ================= */

function Tag({ children }) {
  return (
    <span className="px-3 py-1 text-xs rounded-full bg-white/10 border border-white/20">
      {children}
    </span>
  );
}

/* ================= STATUS ================= */

function StatusBadge({ state }) {
  const map = {
    QUEUED: "⏳ QUEUED",
    PROCESSING: "⚙️ PROCESSING",
    COMPLETED: "✅ COMPLETED",
    FAILED: "❌ FAILED",
  };

  return (
    <span className="px-4 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20">
      {map[state]}
    </span>
  );
}
