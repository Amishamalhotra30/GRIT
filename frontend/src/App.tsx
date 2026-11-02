import { useMemo, useState } from "react";
import type { ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* Types & constants                                                   */
/* ------------------------------------------------------------------ */

type Page =
  | "Dataset Viewer"
  | "Experiment"
  | "Robot Simulation"
  | "Results"
  | "Ablation Study";

type Method =
  | "Standard"
  | "Uniform Redundancy"
  | "Robustness-trained"
  | "GRIT (Task-aware)";

type View = "Robot POV (RGB)" | "Depth Map" | "Point Cloud" | "Top View";

type SceneMode = "rgb" | "depth" | "top" | "corrupt" | "grasp";

const pages: Page[] = [
  "Dataset Viewer",
  "Experiment",
  "Robot Simulation",
  "Results",
  "Ablation Study",
];

const methods: Method[] = [
  "Standard",
  "Uniform Redundancy",
  "Robustness-trained",
  "GRIT (Task-aware)",
];

const views: View[] = [
  "Robot POV (RGB)",
  "Depth Map",
  "Point Cloud",
  "Top View",
];

const corruptions = [
  "Random Feature Erasure",
  "Structured / Block Erasure",
  "Burst Corruption",
  "Feature Noise",
];

const scenes = ["000123", "000124", "000125", "000126"];

const categories = [
  "Mug",
  "Bottle",
  "Bowl",
  "Banana",
  "Box",
  "Camera",
  "Can",
  "Laptop",
  "Tool",
  "Device",
  "Misc",
];

const ablations = [
  "No Task Awareness",
  "No Redundancy",
  "No Recovery Module",
  "Reduced Redundancy (50%)",
];

const splits = ["Test (Official)", "Train", "Validation"];

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function Panel({
  title,
  children,
  className = "",
  right,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  right?: ReactNode;
}) {
  return (
    <section className={`g-panel ${className}`}>
      <header className="g-panel-head">
        <h2>{title}</h2>
        {right}
      </header>
      <div className="g-panel-body">{children}</div>
    </section>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="g-field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Tabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="g-tabs" role="tablist">
      {items.map((item) => (
        <button
          key={item}
          role="tab"
          aria-selected={value === item}
          className={value === item ? "on" : ""}
          onClick={() => onChange(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function DataTable({
  head,
  rows,
}: {
  head: string[];
  rows: ReactNode[][];
}) {
  return (
    <table className="g-table">
      <thead>
        <tr>
          {head.map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ------------------------------------------------------------------ */
/* Illustrative scene (SVG) — clearly labelled, never real data        */
/* ------------------------------------------------------------------ */

function Scene({
  label,
  mode = "rgb",
  corruption = 60,
  className = "",
}: {
  label: string;
  mode?: SceneMode;
  corruption?: number;
  className?: string;
}) {
  const blocks = useMemo(() => {
    if (mode !== "corrupt") return [];
    const palette = [
      "#b98a5a",
      "#8a6a45",
      "#c9a274",
      "#5a4430",
      "#3b6fb5",
      "#c23b3b",
      "#d9c23a",
      "#2f7a4a",
    ];
    const out: { x: number; y: number; fill: string; erased: boolean }[] = [];
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 16; c++) {
        const n = (r * 31 + c * 17 + ((r * c) % 7)) % 100;
        out.push({
          x: c * 20,
          y: r * 20,
          fill: palette[n % palette.length],
          erased: n < corruption,
        });
      }
    }
    return out;
  }, [mode, corruption]);

  return (
    <div className={`g-scene ${mode} ${className}`}>
      <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="g-table" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8a6a48" />
            <stop offset="1" stopColor="#5d4430" />
          </linearGradient>
        </defs>
        <rect width="320" height="200" fill="url(#g-table)" />

        {mode === "corrupt" ? (
          blocks.map((b, i) => (
            <rect
              key={i}
              x={b.x}
              y={b.y}
              width="20"
              height="20"
              fill={b.erased ? "#1d2024" : b.fill}
              opacity={b.erased ? 0.9 : 0.85}
            />
          ))
        ) : (
          <>
            {/* box */}
            <rect x="118" y="40" width="46" height="34" rx="3" fill="#d94b3d" />
            <rect x="118" y="52" width="46" height="8" fill="#f2e6d0" />
            {/* bottle */}
            <rect x="214" y="22" width="26" height="54" rx="8" fill="#f1c40f" />
            <rect x="221" y="14" width="12" height="10" rx="3" fill="#d8aa0a" />
            {/* can */}
            <rect x="256" y="78" width="24" height="38" rx="5" fill="#2e8b57" />
            {/* bowl */}
            <ellipse cx="68" cy="104" rx="30" ry="14" fill="#b3261e" />
            <ellipse cx="68" cy="100" rx="24" ry="8" fill="#7e1912" />
            {/* banana */}
            <path
              d="M70 150 Q110 176 160 134"
              stroke="#f4d03f"
              strokeWidth="11"
              fill="none"
              strokeLinecap="round"
            />
            {/* mug */}
            <rect x="148" y="86" width="42" height="46" rx="6" fill="#2f7fd1" />
            <ellipse cx="169" cy="86" rx="21" ry="6" fill="#1f5c9c" />
            <path
              d="M190 98 q16 0 16 14 q0 14 -16 14"
              stroke="#2f7fd1"
              strokeWidth="6"
              fill="none"
            />
            {/* cube */}
            <rect x="258" y="136" width="36" height="34" rx="3" fill="#8d9298" />
            {mode === "grasp" && (
              <>
                <rect
                  x="140"
                  y="76"
                  width="68"
                  height="62"
                  fill="none"
                  stroke="#f5c518"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
                <line x1="169" y1="108" x2="169" y2="70" stroke="#3ddc84" strokeWidth="2.5" />
                <line x1="169" y1="108" x2="214" y2="120" stroke="#ff4d4d" strokeWidth="2.5" />
                <line x1="169" y1="108" x2="150" y2="136" stroke="#4d9bff" strokeWidth="2.5" />
              </>
            )}
          </>
        )}
      </svg>
      <span className="g-scene-label">{label}</span>
    </div>
  );
}

function PointCloudPreview() {
  const points = useMemo(
    () =>
      Array.from({ length: 260 }, (_, i) => ({
        id: i,
        x: 4 + ((i * 47 + 13) % 92),
        y: 28 + ((i * 31 + Math.floor(i / 4) * 7) % 62),
        hue: [190, 215, 52, 330, 160][i % 5],
        opacity: 0.4 + (i % 5) * 0.12,
      })),
    [],
  );

  return (
    <div className="g-cloud">
      {points.map((p) => (
        <i
          key={p.id}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: `hsl(${p.hue} 90% 60%)`,
            opacity: p.opacity,
          }}
        />
      ))}
      <div className="g-cloud-scale">
        <span>2.0 m</span>
        <b />
        <span>0 m</span>
      </div>
      <span className="g-scene-label">Illustrative point cloud</span>
    </div>
  );
}

function PerformanceChart({ compact = false }: { compact?: boolean }) {
  const series = [
    {
      name: "Standard",
      color: "#ff5c5c",
      values: [0.7, 0.62, 0.51, 0.4, 0.3, 0.22, 0.15, 0.12, 0.1, 0.08],
    },
    {
      name: "Uniform redundancy",
      color: "#4da3ff",
      values: [0.78, 0.72, 0.66, 0.59, 0.53, 0.45, 0.38, 0.31, 0.27, 0.23],
    },
    {
      name: "Robustness-trained",
      color: "#3ddc84",
      values: [0.81, 0.76, 0.7, 0.65, 0.6, 0.53, 0.46, 0.39, 0.34, 0.29],
    },
    {
      name: "GRIT",
      color: "#f5c518",
      values: [0.87, 0.83, 0.79, 0.74, 0.68, 0.62, 0.56, 0.51, 0.47, 0.43],
    },
  ];

  const L = 34;
  const R = 308;
  const T = 10;
  const B = 150;
  const x = (i: number) => L + (i / 9) * (R - L);
  const y = (v: number) => B - v * (B - T);

  return (
    <div className="g-chart">
      <svg viewBox="0 0 320 180" role="img" aria-label="Illustrative curves">
        {[0, 0.2, 0.4, 0.6, 0.8, 1].map((v) => (
          <g key={v}>
            <line x1={L} x2={R} y1={y(v)} y2={y(v)} className="grid" />
            <text x={L - 6} y={y(v) + 3} textAnchor="end">
              {v.toFixed(1)}
            </text>
          </g>
        ))}
        {[0, 2, 4, 6, 8, 9].map((i) => (
          <text key={i} x={x(i)} y={B + 14} textAnchor="middle">
            {i * 10}
          </text>
        ))}
        <text x={(L + R) / 2} y={B + 28} textAnchor="middle">
          Corruption level (%)
        </text>
        {series.map((s) => (
          <g key={s.name}>
            <polyline
              fill="none"
              stroke={s.color}
              strokeWidth={s.name === "GRIT" ? 2.5 : 1.6}
              points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
            />
          </g>
        ))}
      </svg>
      {!compact && (
        <div className="g-legend">
          {series.map((s) => (
            <span key={s.name}>
              <i style={{ background: s.color }} />
              {s.name}
            </span>
          ))}
        </div>
      )}
      <p className="g-note warn">
        Illustrative curves only. These are not experimental results.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */

function App() {
  const [page, setPage] = useState<Page>("Experiment");
  const [scene, setScene] = useState("000123");
  const [selectedCategory, setSelectedCategory] = useState("Mug");
  const [view, setView] = useState<View>("Robot POV (RGB)");
  const [method, setMethod] = useState<Method>("GRIT (Task-aware)");
  const [corruption, setCorruption] = useState(60);
  const [corruptionType, setCorruptionType] = useState(corruptions[0]);
  const [redundancy, setRedundancy] = useState(75);
  const [seed, setSeed] = useState("42");
  const [split, setSplit] = useState(splits[0]);
  const [sceneTab, setSceneTab] = useState("Scenes");
  const [experimentTab, setExperimentTab] = useState("Method & Corruption");

  const [task, setTask] = useState(
    "Pick up the mug and place it beside the blue box.",
  );
  const [commandInput, setCommandInput] = useState(
    "Pick up the mug and place it beside the blue box.",
  );
  const [voiceListening, setVoiceListening] = useState(false);
  const [movementStep, setMovementStep] = useState(2);
  const [targetOffset, setTargetOffset] = useState({ x: 0, y: 0 });
  const [lastCommand, setLastCommand] = useState("No command submitted");

  const [autonomy, setAutonomy] = useState(true);
  const [manualOverride, setManualOverride] = useState(false);
  const [occlusion, setOcclusion] = useState(true);
  const [activePerception, setActivePerception] = useState(true);
  const [running, setRunning] = useState(false);

  const [status, setStatus] = useState("Backend not connected. Preview mode.");
  const [datasetUrl, setDatasetUrl] = useState("");
  const [datasetLoaded, setDatasetLoaded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jointValues, setJointValues] = useState([0, -25, 15, 0, 40, 0]);

  const pageDescriptions: Record<Page, string> = {
    "Dataset Viewer": "Browse RGB-D scenes, objects and annotations",
    Experiment: "Task-aware error-correcting representation analysis",
    "Robot Simulation": "Autonomous task execution with human supervision",
    Results: "Compare measured robustness and grasp performance",
    "Ablation Study": "Measure the contribution of each GRIT component",
  };

  const sceneMode: SceneMode =
    view === "Depth Map" ? "depth" : view === "Top View" ? "top" : "rgb";

  /* ----------------------------- actions ---------------------------- */

  function loadDatasetImage(file: File | null) {
    if (!file) return;
    if (datasetUrl) URL.revokeObjectURL(datasetUrl);
    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setDatasetUrl(url);
    setDatasetLoaded(true);
    setStatus(`Local image preview loaded: ${file.name}`);
  }

  function runExperiment() {
    setRunning(true);
    setStatus(
      "Configuration prepared. Connect the FastAPI experiment endpoint to run inference.",
    );
  }

  function submitTaskCommand() {
    const cleaned = commandInput.trim();
    if (!cleaned) {
      setStatus("Enter a task command first.");
      return;
    }
    setTask(cleaned);
    setLastCommand(cleaned);
    setStatus(
      "Command recorded. Connect the task planner and simulation API to execute it.",
    );
  }

  function moveTarget(direction: "up" | "down" | "left" | "right" | "stop") {
    if (direction === "stop") {
      setStatus(
        "Stop selected. A real stop command requires the simulation backend.",
      );
      return;
    }
    setTargetOffset((current) => ({
      x:
        current.x +
        (direction === "left"
          ? -movementStep
          : direction === "right"
            ? movementStep
            : 0),
      y:
        current.y +
        (direction === "up"
          ? movementStep
          : direction === "down"
            ? -movementStep
            : 0),
    }));
    setStatus(
      `Target preview moved ${direction}. No robot motion has been executed.`,
    );
  }

  function startVoiceCommand() {
    const w = window as Window & {
      SpeechRecognition?: new () => any;
      webkitSpeechRecognition?: new () => any;
    };
    const Recognition = w.SpeechRecognition ?? w.webkitSpeechRecognition;

    if (!Recognition) {
      setStatus(
        "Speech recognition is not supported in this browser. Type your command instead.",
      );
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setVoiceListening(true);
      setStatus("Listening for your command…");
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";
      if (transcript) {
        setCommandInput(transcript);
        setStatus("Command transcribed. Review it, then press Submit command.");
      }
    };
    recognition.onerror = (event: any) => {
      setStatus(`Speech recognition error: ${event.error ?? "unknown error"}`);
    };
    recognition.onend = () => setVoiceListening(false);

    try {
      recognition.start();
    } catch {
      setVoiceListening(false);
      setStatus(
        "Could not start speech recognition. Check microphone permission.",
      );
    }
  }

  /* ------------------------------ render ---------------------------- */

  return (
    <div className="g-app">
      <style>{styles}</style>

      <header className="g-topbar">
        <button
          className="g-brand"
          onClick={() => setPage("Dataset Viewer")}
          aria-label="GRIT home"
        >
          <span className="g-logo">G</span>
          <span className="g-brand-text">
            <strong>GRIT</strong>
            <small>Task-aware error-correcting visual representations</small>
          </span>
        </button>

        <nav className="g-nav" aria-label="Pages">
          {pages.map((item) => (
            <button
              key={item}
              className={page === item ? "on" : ""}
              onClick={() => setPage(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="g-topbar-right">
          <span className="g-dataset-chip">GraspNet-1Billion</span>
          <button
            className="g-icon-btn"
            title="Settings"
            onClick={() => setStatus("Settings panel is not connected yet.")}
          >
            ⚙
          </button>
          <button
            className="g-icon-btn"
            title="Help"
            onClick={() =>
              setStatus("GRIT research dashboard running in preview mode.")
            }
          >
            ?
          </button>
        </div>
      </header>

      <main className="g-main">
        <div className="g-page-head">
          <div>
            <h1>{page}</h1>
            <p>{pageDescriptions[page]}</p>
          </div>
          <span className={`g-conn ${datasetLoaded ? "ok" : ""}`}>
            <i />
            {datasetLoaded ? "Local image loaded" : "Dataset API offline"}
          </span>
        </div>

        {/* ============================ EXPERIMENT ============================ */}
        {page === "Experiment" && (
          <>
            <div className="g-exp-top">
              <Panel title="Dataset & scene" className="g-dataset-panel">
                <SelectField
                  label="Dataset"
                  value="GraspNet-1Billion"
                  options={["GraspNet-1Billion"]}
                  onChange={() => undefined}
                />

                <Tabs
                  items={["Scenes", "Objects", "Categories"] as const}
                  value={sceneTab as "Scenes" | "Objects" | "Categories"}
                  onChange={setSceneTab}
                />

                {sceneTab === "Scenes" && (
                  <div className="g-scene-list">
                    {scenes.map((id, index) => (
                      <button
                        key={id}
                        className={`g-scene-item ${scene === id ? "on" : ""}`}
                        onClick={() => setScene(id)}
                      >
                        <Scene
                          label=""
                          mode="rgb"
                          className={`thumb t${index}`}
                        />
                        <span>
                          Scene {String(index + 1).padStart(3, "0")}
                          <small>{id}</small>
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {sceneTab === "Objects" && (
                  <div className="g-chip-grid">
                    {categories.slice(0, 8).map((c) => (
                      <button
                        key={c}
                        className={selectedCategory === c ? "on" : ""}
                        onClick={() => setSelectedCategory(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}

                {sceneTab === "Categories" && (
                  <div className="g-chip-grid">
                    {categories.map((c) => (
                      <button
                        key={c}
                        className={selectedCategory === c ? "on" : ""}
                        onClick={() => setSelectedCategory(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}

                <div className="g-stack">
                  <SelectField
                    label="Split"
                    value={split}
                    options={splits}
                    onChange={setSplit}
                  />
                  <SelectField
                    label="View"
                    value={view}
                    options={views}
                    onChange={(v) => setView(v as View)}
                  />
                  <label className="g-btn ghost file">
                    Load local image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        loadDatasetImage(e.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                  <p className="g-note">
                    Image preview only. Full scene loading needs the GraspNet
                    dataset adapter.
                  </p>
                </div>
              </Panel>

              <Panel
                title="Experiment visualization"
                className="g-visual-panel"
                right={
                  <span className="g-badge">
                    Scene {scene} · {selectedCategory}
                  </span>
                }
              >
                <Tabs
                  items={views}
                  value={view}
                  onChange={(v) => setView(v)}
                />

                <div className="g-viewport">
                  {datasetUrl && view === "Robot POV (RGB)" ? (
                    <img src={datasetUrl} alt="Loaded local preview" />
                  ) : view === "Point Cloud" ? (
                    <PointCloudPreview />
                  ) : (
                    <Scene
                      mode={sceneMode}
                      label={
                        datasetLoaded
                          ? (selectedFile?.name ?? "Local image")
                          : "Illustrative scene · dataset not connected"
                      }
                    />
                  )}

                  <div className="g-overlay-meta">
                    <span>Scene {scene}</span>
                    <span>Object 0247</span>
                    <span>{selectedCategory}</span>
                    <span>View 1 / 6</span>
                  </div>
                  <div className="g-reticle" />
                </div>
              </Panel>

              <Panel title="Experiment settings" className="g-settings-panel">
                <Tabs
                  items={
                    ["Method & Corruption", "Redundancy", "Task Settings"] as const
                  }
                  value={
                    experimentTab as
                      | "Method & Corruption"
                      | "Redundancy"
                      | "Task Settings"
                  }
                  onChange={setExperimentTab}
                />

                {experimentTab === "Method & Corruption" && (
                  <div className="g-stack">
                    <SelectField
                      label="Representation method"
                      value={method}
                      options={methods}
                      onChange={(v) => setMethod(v as Method)}
                    />
                    <SelectField
                      label="Corruption type"
                      value={corruptionType}
                      options={corruptions}
                      onChange={setCorruptionType}
                    />

                    <div className="g-slider">
                      <div>
                        <span>Corruption level</span>
                        <strong>{corruption}%</strong>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="90"
                        step="10"
                        value={corruption}
                        onChange={(e) => setCorruption(Number(e.target.value))}
                      />
                    </div>

                    <div className="g-slider">
                      <div>
                        <span>Redundancy level</span>
                        <strong>
                          {redundancy >= 70
                            ? "High"
                            : redundancy >= 35
                              ? "Medium"
                              : "Low"}
                        </strong>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={redundancy}
                        onChange={(e) => setRedundancy(Number(e.target.value))}
                      />
                    </div>

                    <label className="g-field">
                      <span>Random seed</span>
                      <input
                        value={seed}
                        onChange={(e) => setSeed(e.target.value)}
                      />
                    </label>
                  </div>
                )}

                {experimentTab === "Redundancy" && (
                  <div className="g-stack">
                    <div className="g-slider">
                      <div>
                        <span>Redundancy level</span>
                        <strong>{redundancy}%</strong>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={redundancy}
                        onChange={(e) => setRedundancy(Number(e.target.value))}
                      />
                    </div>
                    <SelectField
                      label="Allocation strategy"
                      value="Task-aware allocation"
                      options={["Uniform allocation", "Task-aware allocation"]}
                      onChange={() => undefined}
                    />
                    <p className="g-note">
                      Applied by the model after backend integration.
                    </p>
                  </div>
                )}

                {experimentTab === "Task Settings" && (
                  <div className="g-stack">
                    <label className="g-field">
                      <span>Task instruction</span>
                      <textarea
                        rows={4}
                        value={task}
                        onChange={(e) => setTask(e.target.value)}
                      />
                    </label>
                    <label className="g-check">
                      <input
                        type="checkbox"
                        checked={occlusion}
                        onChange={(e) => setOcclusion(e.target.checked)}
                      />
                      Occlusion scenario
                    </label>
                    <label className="g-check">
                      <input
                        type="checkbox"
                        checked={activePerception}
                        onChange={(e) => setActivePerception(e.target.checked)}
                      />
                      Active re-observation
                    </label>
                    <p className="g-note">
                      Task-aware inference needs the model API.
                    </p>
                  </div>
                )}

                <button className="g-btn primary" onClick={runExperiment}>
                  ▶ Run experiment
                </button>
                <p className="g-status">{status}</p>
              </Panel>
            </div>

            <div className="g-exp-mid">
              <Panel
                title="Representation analysis"
                right={<span className="g-sub">Selected frame</span>}
              >
                <div className="g-steps">
                  <figure>
                    <figcaption>1 · Original image</figcaption>
                    {datasetUrl ? (
                      <img src={datasetUrl} alt="Original local" />
                    ) : (
                      <Scene label="Awaiting data" />
                    )}
                  </figure>
                  <figure>
                    <figcaption>2 · Corrupted ({corruption}%)</figcaption>
                    <Scene
                      mode="corrupt"
                      corruption={corruption}
                      label="Corruption preview"
                    />
                  </figure>
                  <figure>
                    <figcaption>3 · Recovered</figcaption>
                    <Scene label="Model not connected" />
                  </figure>
                  <figure>
                    <figcaption>4 · Predicted grasp</figcaption>
                    <Scene mode="grasp" label="Prediction pending" />
                  </figure>
                </div>
              </Panel>

              <Panel title="Run details">
                <dl className="g-details">
                  {[
                    ["Method", method],
                    ["Corruption", `${corruptionType} (${corruption}%)`],
                    ["Redundancy", `${redundancy}%`],
                    ["Dataset", "GraspNet-1Billion"],
                    ["Scene", scene],
                    ["Object", `${selectedCategory} (ID 0247)`],
                    ["Seed", seed],
                    ["Status", running ? "Awaiting backend" : "Preview mode"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              </Panel>
            </div>

            <div className="g-exp-bottom">
              <Panel
                title="Detections"
                right={<span className="g-sub">Current frame</span>}
              >
                <DataTable
                  head={["#", "Object", "Confidence"]}
                  rows={["Mug", "Bowl", "Banana", "Bottle", "Box"].map(
                    (name, i) => [
                      i + 1,
                      name,
                      <span className="g-pending" key={name}>
                        Pending
                      </span>,
                    ],
                  )}
                />
                <p className="g-note">
                  Values appear once real model predictions are connected.
                </p>
              </Panel>

              <Panel title="RGB-D point cloud">
                <PointCloudPreview />
              </Panel>

              <Panel
                title="Performance comparison"
                right={<span className="g-sub">Current experiment</span>}
              >
                <PerformanceChart compact />
              </Panel>

              <Panel
                title="Metrics"
                right={<span className="g-sub">Current frame</span>}
              >
                <DataTable
                  head={["Metric", "Value"]}
                  rows={[
                    "Detection accuracy",
                    "Pose error (m)",
                    "Grasp success",
                    "Semantic recovery",
                    "Inference time",
                    "Representation overhead",
                  ].map((m) => [
                    m,
                    <span className="g-pending" key={m}>
                      Pending
                    </span>,
                  ])}
                />
                <p className="g-note">No fabricated experiment results.</p>
              </Panel>
            </div>
          </>
        )}

        {/* ========================== DATASET VIEWER ========================== */}
        {page === "Dataset Viewer" && (
          <div className="g-two">
            <Panel title="Dataset browser">
              <p className="g-copy">
                Preview local RGB images. Full GraspNet scene loading connects
                through the dataset backend.
              </p>
              <label className="g-btn primary file">
                Choose local RGB image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => loadDatasetImage(e.target.files?.[0] ?? null)}
                />
              </label>

              <div className="g-large-image">
                {datasetUrl ? (
                  <img src={datasetUrl} alt="Loaded local" />
                ) : (
                  <Scene label="No dataset image loaded" />
                )}
              </div>

              <dl className="g-details">
                <div>
                  <dt>Scene</dt>
                  <dd>{scene}</dd>
                </div>
                <div>
                  <dt>Category</dt>
                  <dd>{selectedCategory}</dd>
                </div>
                <div>
                  <dt>Image status</dt>
                  <dd>
                    {datasetLoaded ? "Local preview loaded" : "Awaiting dataset"}
                  </dd>
                </div>
              </dl>
            </Panel>

            <Panel title="RGB-D & camera metadata">
              <p className="g-copy">
                Depth scale, camera intrinsics, coordinate frames and grasp
                annotations appear once the GraspNet adapter is connected.
              </p>
              <dl className="g-details">
                {[
                  "RGB image",
                  "Depth map",
                  "Camera intrinsics",
                  "Point cloud",
                  "Grasp annotations",
                ].map((item) => (
                  <div key={item}>
                    <dt>{item}</dt>
                    <dd className="g-pending">Pending integration</dd>
                  </div>
                ))}
              </dl>
            </Panel>
          </div>
        )}

        {/* ========================== ROBOT SIMULATION ========================== */}
        {page === "Robot Simulation" && (
          <div className="g-sim">
            <Panel
              title="Robot workspace"
              className="g-sim-view"
              right={<span className="g-sub">Franka Panda · simulation</span>}
            >
              <div className="g-viewport tall">
                <Scene mode="rgb" label="PyBullet connection pending" />
                <div
                  className="g-target"
                  style={{
                    left: `calc(50% + ${targetOffset.x * 5}px)`,
                    top: `calc(50% - ${targetOffset.y * 5}px)`,
                  }}
                >
                  <span>Target</span>
                </div>
                <div className="g-overlay-meta">
                  <span>Robot: Franka Panda</span>
                  <span>Scene {scene}</span>
                  <span>ΔX {targetOffset.x}</span>
                  <span>ΔY {targetOffset.y}</span>
                  <span>{manualOverride ? "Manual" : "Autonomous"}</span>
                </div>
              </div>

              <div className="g-toolbar">
                <button
                  className="g-btn ghost"
                  onClick={() => {
                    setTargetOffset({ x: 0, y: 0 });
                    setStatus("Target preview reset.");
                  }}
                >
                  Reset target
                </button>
                <button
                  className="g-btn ghost"
                  onClick={() =>
                    setStatus(
                      "Home target selected. Simulation backend is not connected.",
                    )
                  }
                >
                  Home target
                </button>
                <button
                  className="g-btn ghost"
                  onClick={() =>
                    setStatus(
                      "Grasp requested. Connect PyBullet to execute the action.",
                    )
                  }
                >
                  Grasp target
                </button>
              </div>
              <p className="g-status">{status}</p>
            </Panel>

            <Panel
              title="Task commander"
              right={<span className="g-sub">Text / voice</span>}
            >
              <div className="g-stack">
                <label className="g-field">
                  <span>Task instruction</span>
                  <textarea
                    rows={4}
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    placeholder="Move the mug behind the box, then pick it up."
                  />
                </label>

                <div className="g-row">
                  <button className="g-btn primary" onClick={submitTaskCommand}>
                    Submit command
                  </button>
                  <button
                    className={`g-btn ghost ${voiceListening ? "live" : ""}`}
                    onClick={startVoiceCommand}
                  >
                    {voiceListening ? "● Listening…" : "🎙 Speak"}
                  </button>
                </div>

                <div className="g-last">
                  <span>Last command</span>
                  <p>{lastCommand}</p>
                </div>

                <label className="g-check">
                  <input
                    type="checkbox"
                    checked={autonomy}
                    onChange={(e) => setAutonomy(e.target.checked)}
                  />
                  Autonomous task execution
                </label>
                <label className="g-check">
                  <input
                    type="checkbox"
                    checked={occlusion}
                    onChange={(e) => setOcclusion(e.target.checked)}
                  />
                  Occluded-object scenario
                </label>
                <label className="g-check">
                  <input
                    type="checkbox"
                    checked={activePerception}
                    onChange={(e) => setActivePerception(e.target.checked)}
                  />
                  Active re-observation
                </label>

                <button
                  className="g-btn primary"
                  onClick={() => {
                    setTask(commandInput);
                    setRunning(true);
                    setStatus(
                      autonomy
                        ? "Autonomous execution requested. Simulation backend is not connected."
                        : "Task prepared. Enable autonomy or use manual controls.",
                    );
                  }}
                >
                  ▶ {autonomy ? "Execute task" : "Prepare task"}
                </button>

                <p className="g-note">
                  Current task: {task}
                  {running ? " (queued)" : ""}. Execution needs the task planner
                  and PyBullet backend.
                </p>
              </div>
            </Panel>

            <Panel
              title="Manual target control"
              right={<span className="g-sub">Operator input</span>}
            >
              <div className="g-stack">
                <div className="g-seg">
                  <button
                    className={!manualOverride ? "on" : ""}
                    onClick={() => {
                      setManualOverride(false);
                      setAutonomy(true);
                      setStatus("Autonomous mode selected.");
                    }}
                  >
                    Autonomous
                  </button>
                  <button
                    className={manualOverride ? "on" : ""}
                    onClick={() => {
                      setManualOverride(true);
                      setAutonomy(false);
                      setStatus("Manual override selected.");
                    }}
                  >
                    Manual override
                  </button>
                </div>

                <div className="g-dpad">
                  <span />
                  <button aria-label="Move up" onClick={() => moveTarget("up")}>
                    ↑
                  </button>
                  <span />
                  <button
                    aria-label="Move left"
                    onClick={() => moveTarget("left")}
                  >
                    ←
                  </button>
                  <button
                    className="stop"
                    aria-label="Stop"
                    onClick={() => moveTarget("stop")}
                  >
                    ■
                  </button>
                  <button
                    aria-label="Move right"
                    onClick={() => moveTarget("right")}
                  >
                    →
                  </button>
                  <span />
                  <button
                    aria-label="Move down"
                    onClick={() => moveTarget("down")}
                  >
                    ↓
                  </button>
                  <span />
                </div>

                <div className="g-slider">
                  <div>
                    <span>Movement step</span>
                    <strong>{movementStep} units</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={movementStep}
                    onChange={(e) => setMovementStep(Number(e.target.value))}
                  />
                </div>

                <div className="g-readout">
                  <div>
                    <span>Target X</span>
                    <strong>{targetOffset.x}</strong>
                  </div>
                  <div>
                    <span>Target Y</span>
                    <strong>{targetOffset.y}</strong>
                  </div>
                  <div>
                    <span>Step</span>
                    <strong>{movementStep}</strong>
                  </div>
                </div>

                <button
                  className="g-btn ghost"
                  onClick={() => {
                    setTargetOffset({ x: 0, y: 0 });
                    setStatus("Target coordinates reset to zero.");
                  }}
                >
                  ↺ Reset target position
                </button>

                <p className="g-note">
                  Arrows move the on-screen target preview only. Robot joints
                  stay still until the simulation controller is connected.
                </p>

                <div className="g-joints">
                  {jointValues.map((value, index) => (
                    <label key={index}>
                      <span>
                        Joint {index + 1}
                        <b>{value}°</b>
                      </span>
                      <input
                        type="range"
                        min="-90"
                        max="90"
                        value={value}
                        onChange={(e) =>
                          setJointValues((current) =>
                            current.map((j, i) =>
                              i === index ? Number(e.target.value) : j,
                            ),
                          )
                        }
                      />
                    </label>
                  ))}
                </div>

                <button
                  className="g-btn ghost"
                  onClick={() => {
                    setJointValues([0, -25, 15, 0, 40, 0]);
                    setStatus("Joint preview values reset.");
                  }}
                >
                  Reset joint preview
                </button>
              </div>
            </Panel>
          </div>
        )}

        {/* ============================== RESULTS ============================= */}
        {page === "Results" && (
          <div className="g-two">
            <Panel title="Experiment results">
              <p className="g-copy">
                Only measured evaluation outputs appear here. Illustrative
                values are never treated as experimental results.
              </p>
              <DataTable
                head={["Method", "Clean", "Corrupted", "Status"]}
                rows={methods.map((m) => [
                  m,
                  <span className="g-pending" key={`${m}-c`}>
                    Pending
                  </span>,
                  <span className="g-pending" key={`${m}-x`}>
                    Pending
                  </span>,
                  "Not evaluated",
                ])}
              />
            </Panel>
            <Panel title="Corruption severity">
              <PerformanceChart />
            </Panel>
          </div>
        )}

        {/* ============================ ABLATION STUDY ========================== */}
        {page === "Ablation Study" && (
          <div className="g-two">
            <Panel title="GRIT ablation configurations">
              <p className="g-copy">
                Four required ablations, evaluated with the same protocol as the
                full method.
              </p>
              <div className="g-ablation-list">
                {ablations.map((item, index) => (
                  <div className="g-ablation" key={item}>
                    <span className="n">{index + 1}</span>
                    <strong>{item}</strong>
                    <span className="g-pill">Not run</span>
                    <button
                      className="g-btn ghost sm"
                      onClick={() =>
                        setStatus(
                          `${item}: selected. Experiment backend is not connected.`,
                        )
                      }
                    >
                      Configure
                    </button>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Ablation results">
              <p className="g-copy">
                Metrics appear after the ablation experiments finish.
              </p>
              <DataTable
                head={["Variant", "Grasp metric", "Robustness", "Result"]}
                rows={ablations.map((item) => [
                  item,
                  <span className="g-pending" key={`${item}-g`}>
                    Pending
                  </span>,
                  <span className="g-pending" key={`${item}-r`}>
                    Pending
                  </span>,
                  "Not run",
                ])}
              />
            </Panel>
          </div>
        )}

        <footer className="g-footer">
          <span>GRIT · Local research prototype · No cloud services</span>
          <span>{status}</span>
        </footer>
      </main>
    </div>
  );
}

export default App;

/* ------------------------------------------------------------------ */
/* Styles (embedded so App.tsx is the only file you need to change)    */
/* ------------------------------------------------------------------ */

const styles = `
html, body, #root { margin: 0; min-height: 100%; background: #0e0f11; }
* { box-sizing: border-box; }

.g-app {
  --bg: #0e0f11;
  --panel: #16181b;
  --raised: #1d2024;
  --line: #2a2e34;
  --text: #eceef0;
  --muted: #8d939c;
  --accent: #f5c518;
  --accent-soft: rgba(245, 197, 24, 0.12);
  --ok: #3ddc84;
  --warn: #ffb020;
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
  font-size: 13px;
  line-height: 1.45;
}
.g-app button, .g-app input, .g-app select, .g-app textarea { font: inherit; color: inherit; }
.g-app button { cursor: pointer; }
.g-app :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

/* top bar */
.g-topbar {
  position: sticky; top: 0; z-index: 20;
  display: flex; align-items: center; gap: 24px;
  padding: 10px 20px;
  background: rgba(14, 15, 17, 0.92);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--line);
}
.g-brand { display: flex; align-items: center; gap: 10px; background: none; border: 0; padding: 0; text-align: left; }
.g-logo {
  width: 32px; height: 32px; display: grid; place-items: center;
  background: var(--accent); color: #111; font-weight: 800; border-radius: 8px;
}
.g-brand-text { display: flex; flex-direction: column; line-height: 1.15; }
.g-brand-text strong { font-size: 18px; letter-spacing: 0.04em; color: var(--accent); }
.g-brand-text small { color: var(--muted); font-size: 11px; }
.g-nav { display: flex; gap: 4px; margin: 0 auto; flex-wrap: wrap; }
.g-nav button {
  background: none; border: 0; padding: 8px 14px; border-radius: 8px; color: var(--muted);
}
.g-nav button:hover { color: var(--text); background: var(--raised); }
.g-nav button.on { background: var(--accent); color: #111; font-weight: 600; }
.g-topbar-right { display: flex; align-items: center; gap: 8px; }
.g-dataset-chip {
  padding: 6px 12px; border: 1px solid var(--line); border-radius: 999px; color: var(--muted); font-size: 12px;
}
.g-icon-btn {
  width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--line); background: var(--panel);
}
.g-icon-btn:hover { border-color: var(--accent); }

/* page */
.g-main { max-width: 1680px; margin: 0 auto; padding: 20px; }
.g-page-head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px; gap: 12px; }
.g-page-head h1 { margin: 0; font-size: 22px; font-weight: 650; }
.g-page-head p { margin: 2px 0 0; color: var(--muted); }
.g-conn { display: inline-flex; align-items: center; gap: 8px; color: var(--muted); font-size: 12px; }
.g-conn i { width: 8px; height: 8px; border-radius: 50%; background: var(--warn); }
.g-conn.ok i { background: var(--ok); }

/* panel */
.g-panel { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; display: flex; flex-direction: column; min-width: 0; }
.g-panel-head {
  display: flex; justify-content: space-between; align-items: center; gap: 8px;
  padding: 12px 16px; border-bottom: 1px solid var(--line);
}
.g-panel-head h2 { margin: 0; font-size: 14px; font-weight: 600; }
.g-panel-body { padding: 16px; display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.g-sub { color: var(--muted); font-size: 12px; }
.g-badge { background: var(--accent-soft); color: var(--accent); padding: 3px 10px; border-radius: 999px; font-size: 12px; }

/* layouts */
.g-exp-top { display: grid; grid-template-columns: 290px minmax(0, 1fr) 320px; gap: 16px; align-items: start; }
.g-exp-mid { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 16px; margin-top: 16px; }
.g-exp-bottom { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-top: 16px; }
.g-two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; align-items: start; }
.g-sim { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(280px, 1fr) minmax(280px, 1fr); gap: 16px; align-items: start; }
.g-stack { display: flex; flex-direction: column; gap: 12px; }
.g-row { display: flex; gap: 8px; }
.g-row .g-btn { flex: 1; }

/* form controls */
.g-field { display: flex; flex-direction: column; gap: 5px; }
.g-field > span { color: var(--muted); font-size: 12px; }
.g-field select, .g-field input, .g-field textarea {
  background: var(--raised); border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px; width: 100%;
}
.g-field textarea { resize: vertical; }
.g-field select:hover, .g-field input:hover, .g-field textarea:hover { border-color: #3b4047; }

.g-slider { display: flex; flex-direction: column; gap: 6px; }
.g-slider > div { display: flex; justify-content: space-between; }
.g-slider span { color: var(--muted); font-size: 12px; }
.g-slider strong { color: var(--accent); font-weight: 600; }
.g-slider input[type="range"], .g-joints input[type="range"] { width: 100%; accent-color: var(--accent); }

.g-check { display: flex; align-items: center; gap: 8px; }
.g-check input { accent-color: var(--accent); }

.g-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  padding: 10px 14px; border-radius: 8px; border: 1px solid var(--line); background: var(--raised); font-weight: 600; text-align: center;
}
.g-btn:hover { border-color: var(--accent); }
.g-btn.primary { background: var(--accent); color: #111; border-color: var(--accent); }
.g-btn.primary:hover { filter: brightness(1.07); }
.g-btn.ghost { background: transparent; }
.g-btn.sm { padding: 5px 10px; font-weight: 500; }
.g-btn.live { border-color: #ff5c5c; color: #ff8a8a; }
.g-btn.file { cursor: pointer; }
.g-btn.file input { display: none; }

/* tabs */
.g-tabs { display: flex; gap: 2px; padding: 3px; background: var(--raised); border-radius: 9px; flex-wrap: wrap; }
.g-tabs button { flex: 1; background: none; border: 0; padding: 6px 10px; border-radius: 7px; color: var(--muted); white-space: nowrap; }
.g-tabs button:hover { color: var(--text); }
.g-tabs button.on { background: var(--panel); color: var(--accent); box-shadow: 0 0 0 1px var(--line); }

/* scene lists */
.g-scene-list { display: flex; flex-direction: column; gap: 8px; }
.g-scene-item {
  display: flex; align-items: center; gap: 10px; padding: 6px; text-align: left;
  background: var(--raised); border: 1px solid transparent; border-radius: 10px;
}
.g-scene-item:hover { border-color: var(--line); }
.g-scene-item.on { border-color: var(--accent); background: var(--accent-soft); }
.g-scene-item .g-scene { width: 76px; flex: none; border-radius: 6px; }
.g-scene-item span { display: flex; flex-direction: column; }
.g-scene-item small { color: var(--muted); }
.g-chip-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.g-chip-grid button { padding: 6px 12px; border-radius: 999px; background: var(--raised); border: 1px solid var(--line); }
.g-chip-grid button.on { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }

/* scene placeholder */
.g-scene { position: relative; width: 100%; aspect-ratio: 16 / 10; overflow: hidden; border-radius: 8px; background: #2b2118; }
.g-scene svg { width: 100%; height: 100%; display: block; }
.g-scene.depth svg { filter: grayscale(1) contrast(1.4) brightness(0.9); }
.g-scene.top svg { transform: scale(1.18) rotate(-4deg); }
.g-scene.thumb.t1 svg { transform: scaleX(-1); }
.g-scene.thumb.t2 svg { transform: scale(1.2); }
.g-scene.thumb.t3 svg { transform: scale(1.1) translate(-4%, 3%); }
.g-scene-label {
  position: absolute; left: 8px; bottom: 8px; padding: 2px 8px; border-radius: 6px;
  background: rgba(0, 0, 0, 0.6); color: #d8dbe0; font-size: 11px;
}
.g-scene-label:empty { display: none; }

.g-viewport { position: relative; border-radius: 10px; overflow: hidden; background: #000; }
.g-viewport .g-scene { border-radius: 0; aspect-ratio: 16 / 9; }
.g-viewport.tall .g-scene { aspect-ratio: 16 / 10; }
.g-viewport img { width: 100%; display: block; aspect-ratio: 16 / 9; object-fit: cover; }
.g-overlay-meta {
  position: absolute; top: 10px; right: 10px; display: flex; flex-direction: column; gap: 1px;
  padding: 8px 10px; background: rgba(0, 0, 0, 0.62); border-radius: 8px; font-size: 11px; color: #d8dbe0;
}
.g-reticle {
  position: absolute; left: 46%; top: 44%; width: 60px; height: 60px;
  border: 1.5px solid var(--accent); border-radius: 6px; pointer-events: none;
}
.g-target { position: absolute; width: 36px; height: 36px; margin: -18px 0 0 -18px; border: 2px solid var(--accent); border-radius: 50%; transition: left 0.15s, top 0.15s; }
.g-target span { position: absolute; top: 40px; left: 50%; transform: translateX(-50%); font-size: 10px; color: var(--accent); }

/* analysis */
.g-steps { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.g-steps figure { margin: 0; display: flex; flex-direction: column; gap: 6px; }
.g-steps figcaption { color: var(--muted); font-size: 12px; }
.g-steps img { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; border-radius: 8px; }

/* details */
.g-details { margin: 0; display: flex; flex-direction: column; }
.g-details > div { display: flex; justify-content: space-between; gap: 12px; padding: 7px 0; border-bottom: 1px solid var(--line); }
.g-details > div:last-child { border-bottom: 0; }
.g-details dt { color: var(--muted); }
.g-details dd { margin: 0; font-weight: 550; text-align: right; }

/* tables */
.g-table { width: 100%; border-collapse: collapse; }
.g-table th { text-align: left; color: var(--muted); font-weight: 500; font-size: 12px; padding: 6px 8px; border-bottom: 1px solid var(--line); }
.g-table td { padding: 8px; border-bottom: 1px solid #1f2227; }
.g-table tr:last-child td { border-bottom: 0; }
.g-pending { color: var(--muted); font-style: italic; }

/* chart + cloud */
.g-chart svg { width: 100%; height: auto; display: block; }
.g-chart text { fill: var(--muted); font-size: 8px; }
.g-chart .grid { stroke: #2a2e34; stroke-width: 0.6; }
.g-legend { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 4px; color: var(--muted); font-size: 12px; }
.g-legend span { display: inline-flex; align-items: center; gap: 6px; }
.g-legend i { width: 10px; height: 3px; border-radius: 2px; display: inline-block; }
.g-cloud { position: relative; aspect-ratio: 16 / 10; border-radius: 8px; overflow: hidden; background: radial-gradient(ellipse at 50% 70%, #1d2128, #0b0c0e); }
.g-cloud i { position: absolute; width: 3px; height: 3px; border-radius: 50%; }
.g-cloud-scale { position: absolute; right: 8px; top: 8px; bottom: 8px; display: flex; flex-direction: column; align-items: center; justify-content: space-between; font-size: 10px; color: var(--muted); }
.g-cloud-scale b { flex: 1; width: 5px; margin: 4px 0; border-radius: 3px; background: linear-gradient(#ff3b3b, #ffd23b, #3bff7a, #3b7bff); }

/* notes */
.g-note { margin: 0; color: var(--muted); font-size: 12px; }
.g-note.warn { color: var(--warn); margin-top: 6px; }
.g-copy { margin: 0; color: var(--muted); max-width: 70ch; }
.g-status { margin: 0; padding: 8px 10px; background: var(--raised); border-radius: 8px; color: var(--muted); font-size: 12px; }

/* simulation */
.g-toolbar { display: flex; gap: 8px; flex-wrap: wrap; }
.g-last { background: var(--raised); border-radius: 8px; padding: 10px; }
.g-last span { color: var(--muted); font-size: 12px; }
.g-last p { margin: 4px 0 0; }
.g-seg { display: flex; padding: 3px; background: var(--raised); border-radius: 9px; }
.g-seg button { flex: 1; background: none; border: 0; padding: 7px; border-radius: 7px; color: var(--muted); }
.g-seg button.on { background: var(--accent); color: #111; font-weight: 600; }
.g-dpad { display: grid; grid-template-columns: repeat(3, 54px); grid-auto-rows: 54px; gap: 6px; justify-content: center; }
.g-dpad button { background: var(--raised); border: 1px solid var(--line); border-radius: 10px; font-size: 18px; }
.g-dpad button:hover { border-color: var(--accent); color: var(--accent); }
.g-dpad .stop { color: #ff7a7a; }
.g-readout { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.g-readout div { background: var(--raised); border-radius: 8px; padding: 8px; display: flex; flex-direction: column; align-items: center; }
.g-readout span { color: var(--muted); font-size: 11px; }
.g-readout strong { font-size: 16px; color: var(--accent); }
.g-joints { display: flex; flex-direction: column; gap: 8px; }
.g-joints label > span { display: flex; justify-content: space-between; color: var(--muted); font-size: 12px; }
.g-joints b { color: var(--text); font-weight: 600; }

/* misc */
.g-large-image { border-radius: 10px; overflow: hidden; }
.g-large-image img { width: 100%; display: block; }
.g-ablation-list { display: flex; flex-direction: column; gap: 8px; }
.g-ablation { display: grid; grid-template-columns: 28px 1fr auto auto; align-items: center; gap: 12px; padding: 10px 12px; background: var(--raised); border-radius: 10px; }
.g-ablation .n { width: 24px; height: 24px; display: grid; place-items: center; border-radius: 50%; background: var(--accent-soft); color: var(--accent); font-size: 12px; font-weight: 600; }
.g-pill { padding: 2px 10px; border-radius: 999px; background: #262a2f; color: var(--muted); font-size: 12px; }

.g-footer { display: flex; justify-content: space-between; gap: 12px; margin-top: 20px; padding-top: 14px; border-top: 1px solid var(--line); color: var(--muted); font-size: 12px; flex-wrap: wrap; }

/* responsive */
@media (max-width: 1280px) {
  .g-exp-top { grid-template-columns: 260px minmax(0, 1fr); }
  .g-settings-panel { grid-column: 1 / -1; }
  .g-exp-bottom { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .g-sim { grid-template-columns: 1fr 1fr; }
  .g-sim-view { grid-column: 1 / -1; }
}
@media (max-width: 860px) {
  .g-topbar { flex-wrap: wrap; gap: 10px; }
  .g-nav { order: 3; width: 100%; margin: 0; }
  .g-topbar-right { margin-left: auto; }
  .g-exp-top, .g-exp-mid, .g-exp-bottom, .g-two, .g-sim { grid-template-columns: 1fr; }
  .g-steps { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .g-main { padding: 14px; }
}
@media (prefers-reduced-motion: reduce) {
  .g-target { transition: none; }
}
`;