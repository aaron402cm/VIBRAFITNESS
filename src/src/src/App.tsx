import React, { useState, useEffect, useRef, FormEvent } from "react";
import { 
  IdCard, 
  Lock, 
  Users, 
  CalendarCheck, 
  Activity, 
  AlertTriangle, 
  Search, 
  BarChart3, 
  Bell, 
  UserMinus, 
  ArrowRight, 
  Camera, 
  Save, 
  X, 
  Phone, 
  Cake, 
  Hourglass, 
  CheckCircle, 
  RefreshCw,
  Eye
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// URL de tu API de Google Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbyOCkoYWJ44abs2fuw5-yPgkMC2bCkHaDiYg1dHX_9oLiDlwrBVA_wpKEGZlXDJNl9X/exec";

// Silueta de avatar por defecto
const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23475569'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='1' d='M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z'/></svg>";

interface Cliente {
  dni: string;
  nombre: string;
  fechaNacimiento: string;
  celular: string;
  plan: string;
  estado: string;
  fechaInicio: string;
  fechaVencimiento: string;
  foto?: string;
  diasInactivo?: number;
  ultimoRegistro?: string;
}

interface PersonaDentro {
  nombre: string;
  horaIngreso: string;
  minutosDentro: number;
  foto?: string;
}

interface KPIs {
  miembrosActivos: string;
  asistenciasHoy: string;
  personasDentro: string;
  vencidosAlerta: string;
}

interface Plan {
  nombre: string;
  duracion: string;
  unidad: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"registro" | "admin">("registro");
  const [adminSubSection, setAdminSubSection] = useState<"buscador" | "graficas" | "alertas" | "inactivos">("buscador");
  const [inputDni, setInputDni] = useState("");
  const [showLoader, setShowLoader] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState("Procesando Membresía");
  
  const [pantallaGigante, setPantallaGigante] = useState<{
    visible: boolean;
    usuario?: {
      nombre: string;
      plan: string;
      fechaVencimiento: string;
      message: string;
      foto?: string;
      esCumpleanos?: boolean;
      movimiento?: string;
    };
    status?: "activo" | "vencido" | "error";
    errorMsg?: string;
  }>({ visible: false });

  const [kpis, setKpis] = useState<KPIs>({
    miembrosActivos: "...",
    asistenciasHoy: "...",
    personasDentro: "...",
    vencidosAlerta: "..."
  });
  const [listadoClientes, setListadoClientes] = useState<Cliente[]>([]);
  const [listadoPlanes, setListadoPlanes] = useState<Plan[]>([]);
  const [ultimosIngresos, setUltimosIngresos] = useState<any[]>([]);
  const [proximosVencer, setProximosVencer] = useState<any[]>([]);
  const [inactivosList, setInactivosList] = useState<any[]>([]);
  const [personasDentroList, setPersonasDentroList] = useState<PersonaDentro[]>([]);
  
  const [adminSearchQuery, setAdminSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [editorModal, setEditorModal] = useState<{
    visible: boolean;
    cliente?: Cliente;
  }>({ visible: false });
  
  const [editFormData, setEditFormData] = useState({
    dni: "",
    nombre: "",
    fechaNacimiento: "",
    celular: "",
    plan: "",
    estado: "Activo",
    fechaInicio: "",
    fechaVencimiento: ""
  });
  const [fotoBase64Editor, setFotoBase64Editor] = useState("");
  const [cameraActive, setCameraActive] = useState(false);

  const [showDentroGymModal, setShowDentroGymModal] = useState(false);
  const [fotoDentroModal, setFotoDentroModal] = useState<{
    visible: boolean;
    persona?: PersonaDentro;
  }>({ visible: false });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartHoursRef = useRef<any>(null);
  const chartDaysRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputDniRef = useRef<HTMLInputElement | null>(null);
  const [cachedCharts, setCachedCharts] = useState<any>(null);

  useEffect(() => {
    if (activeTab === "registro" && !pantallaGigante.visible) {
      setTimeout(() => {
        inputDniRef.current?.focus();
      }, 400);
    }
  }, [activeTab, pantallaGigante.visible]);

  const playSound = (type: "success" | "error" | "click" | "keyboard" | "birthday") => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      
      if (type === "click") {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      } else if (type === "keyboard") {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(500 + Math.random() * 200, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
      } else if (type === "success") {
        const now = audioCtx.currentTime;
        [880, 1318.51].forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.12, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.35);
        });
      } else if (type === "error") {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.4);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start();
        osc.stop(now + 0.4);
      } else if (type === "birthday") {
        const notes = [
          { f: 261.63, d: 0.25 }, 
          { f: 261.63, d: 0.25 }, 
          { f: 293.66, d: 0.50 }, 
          { f: 261.63, d: 0.50 }, 
          { f: 349.23, d: 0.50 }, 
          { f: 329.63, d: 1.00 }  
        ];
        let time = audioCtx.currentTime;
        notes.forEach(note => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.type = "triangle";
          osc.frequency.setValueAtTime(note.f, time);
          gain.gain.setValueAtTime(0, time);
          gain.gain.linearRampToValueAtTime(0.1, time + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, time + note.d - 0.02);
          osc.start(time);
          osc.stop(time + note.d);
          time += note.d + 0.05; 
        });
      }
    } catch (e) {
      console.warn("AudioContext silenciado por seguridad del navegador", e);
    }
  };

  const handleTabChange = (tab: "registro" | "admin") => {
    playSound("click");
    setActiveTab(tab);
    if (tab === "admin") {
      consultarDatosAdmin();
    }
  };

  const handleRegisterAsistencia = (e: FormEvent) => {
    e.preventDefault();
    const dni = inputDni.trim();
    if (!dni) return;

    setShowLoader(true);
    setLoaderMessage("Procesando Membresía");
    setPantallaGigante({ visible: false });

    fetch(`${API_URL}?action=registrarAsistencia&dni=${encodeURIComponent(dni)}`)
      .then(response => response.json())
      .then(res => {
        setShowLoader(false);
        setInputDni("");

        if (res.success) {
          presentarPantallaGigante(res.data, res.status);
        } else {
          presentarErrorPantallaGigante(res.message || "Usuario no registrado");
        }
      })
      .catch(error => {
        setShowLoader(false);
        setInputDni("");
        presentarErrorPantallaGigante("Error de red o conexión fallida.");
        console.error(error);
      });
  };

  const presentarPantallaGigante = (usuario: any, status: string) => {
    const isActivo = status === "activo";
    const esBday = usuario.esCumpleanos;

    setPantallaGigante({
      visible: true,
      usuario: {
        nombre: usuario.nombre,
        plan: usuario.plan,
        fechaVencimiento: usuario.fechaVencimiento,
        message: usuario.message || usuario.mensaje || "¡Buen entrenamiento hoy!",
        foto: usuario.foto,
        esCumpleanos: esBday,
        movimiento: usuario.movimiento
      },
      status: isActivo ? "activo" : "vencido"
    });

    if (isActivo) {
      if (esBday) {
        playSound("birthday");
        lanzarExplosionConfeti();
        crearGlobosFlotantes();
      } else {
        playSound("success");
      }
    } else {
      playSound("error");
    }

    setTimeout(() => {
      setPantallaGigante(prev => {
        if (prev.visible) {
          return { visible: false };
        }
        return prev;
      });
    }, 5000);
  };

  const presentarErrorPantallaGigante = (mensaje: string) => {
    setPantallaGigante({
      visible: true,
      status: "error",
      errorMsg: mensaje
    });

    playSound("error");

    setTimeout(() => {
      setPantallaGigante(prev => {
        if (prev.visible) {
          return { visible: false };
        }
        return prev;
      });
    }, 5000);
  };

  const lanzarExplosionConfeti = () => {
    const confettiFunc = (window as any).confetti;
    if (!confettiFunc) return;
    
    const duration = 4 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 50 * (timeLeft / duration);
      confettiFunc(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
      confettiFunc(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
  };

  const crearGlobosFlotantes = () => {
    const container = document.createElement("div");
    container.id = "birthday-balloons-react";
    container.className = "fixed inset-0 pointer-events-none z-50 overflow-hidden";
    document.body.appendChild(container);
    
    const colores = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];
    
    for (let i = 0; i < 20; i++) {
      const globo = document.createElement("div");
      const colorRandom = colores[Math.floor(Math.random() * colores.length)];
      
      globo.className = "absolute bottom-0 w-12 h-16 rounded-full opacity-80 shadow-[inset_-5px_-5px_0_rgba(0,0,0,0.15)] flex flex-col items-center justify-end";
      globo.style.backgroundColor = colorRandom;
      globo.style.left = Math.random() * 90 + "vw";
      
      const hilo = document.createElement("div");
      hilo.className = "w-0.5 h-12 bg-slate-400 absolute top-full";
      globo.appendChild(hilo);
      
      container.appendChild(globo);
      
      const velocidad = Math.random() * 4000 + 3000; 
      const retardo = Math.random() * 1500;
      
      setTimeout(() => {
        globo.animate([
          { transform: "translateY(110vh) rotate(0deg)" },
          { transform: `translateY(-120vh) rotate(${Math.random() * 40 - 20}deg)` }
        ], {
          duration: velocidad,
          easing: "ease-in-out",
          fill: "forwards"
        });
      }, retardo);
    }
    
    setTimeout(() => container.remove(), 7500); 
  };

  const consultarDatosAdmin = () => {
    setKpis({
      miembrosActivos: "...",
      asistenciasHoy: "...",
      personasDentro: "...",
      vencidosAlerta: "..."
    });

    fetch(`${API_URL}?action=getAdminDashboardData`)
      .then(res => res.json())
      .then(res => {
        if (!res.success) {
          alert("Error al cargar datos del panel: " + res.message);
          return;
        }

        setKpis({
          miembrosActivos: String(res.kpis.miembrosActivos),
          asistenciasHoy: String(res.kpis.asistenciasHoy),
          personasDentro: String(res.kpis.personasDentro),
          vencidosAlerta: String(res.kpis.vencidosAlerta)
        });

        setListadoClientes(res.clientesList || []);
        setCachedCharts(res.charts);
        setUltimosIngresos(res.ultimosIngresos || []);
        setProximosVencer(res.proximosVencer || []);
        setInactivosList(res.inactivosList || []);
        setPersonasDentroList(res.personasDentroList || []);
      })
      .catch(err => {
        console.error("Fallo al consultar el API del Administrador: ", err);
        setKpis({
          miembrosActivos: "ERR",
          asistenciasHoy: "ERR",
          personasDentro: "ERR",
          vencidosAlerta: "ERR"
        });
      });
  };

  const cargarPlanesEnEditor = () => {
    if (listadoPlanes.length > 0) return; 

    fetch(`${API_URL}?action=getPlanes`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setListadoPlanes(data.planes || []);
        }
      })
      .catch(err => console.error("Error al cargar planes: ", err));
  };

  const handleSearchInput = (val: string) => {
    setAdminSearchQuery(val);
    setShowSearchResults(val.trim().length > 0);
  };

  const getFilteredClientes = () => {
    if (!adminSearchQuery) return [];
    const q = adminSearchQuery.toUpperCase();
    return listadoClientes.filter(c => 
      c.dni.includes(q) || c.nombre.toUpperCase().includes(q)
    );
  };

  const abrirEditorModal = (cliente: Cliente) => {
    playSound("click");
    cargarPlanesEnEditor();
    
    setEditFormData({
      dni: cliente.dni,
      nombre: cliente.nombre,
      fechaNacimiento: cliente.fechaNacimiento || "",
      celular: cliente.celular || "",
      plan: cliente.plan,
      estado: cliente.estado || "Activo",
      fechaInicio: cliente.fechaInicio || "",
      fechaVencimiento: cliente.fechaVencimiento || ""
    });
    
    setFotoBase64Editor(cliente.foto || "");
    setEditorModal({
      visible: true,
      cliente: cliente
    });
    setShowSearchResults(false);
  };

  const cerrarEditorModal = () => {
    playSound("click");
    desactivarCamaraEditor();
    setEditorModal({ visible: false });
  };

  const handleEditorFormChange = (field: string, val: string) => {
    setEditFormData(prev => ({ ...prev, [field]: val }));
  };

  useEffect(() => {
    const { plan, fechaInicio } = editFormData;
    if (!plan || !fechaInicio || listadoPlanes.length === 0) return;

    const planInfo = listadoPlanes.find(p => p.nombre.trim().toUpperCase() === plan.trim().toUpperCase());
    if (!planInfo) return;

    const unidad = planInfo.unidad.trim().toUpperCase();
    if (unidad === "LIBRE") {
      setEditFormData(prev => ({ ...prev, fechaVencimiento: "LIBRE" }));
      return;
    }

    const partes = fechaInicio.split("/");
    if (partes.length < 3) return;

    try {
      const d = parseInt(partes[0], 10);
      const m = parseInt(partes[1], 10) - 1;
      const y = parseInt(partes[2], 10);
      if (isNaN(d) || isNaN(m) || isNaN(y)) return;

      const fInicio = new Date(y, m, d);
      const fVencimiento = new Date(fInicio);
      const duracion = parseInt(planInfo.duracion, 10);

      if (unidad === "DIAS" || unidad === "DÍAS") {
        fVencimiento.setDate(fInicio.getDate() + duracion);
      } else if (unidad === "MESES") {
        fVencimiento.setMonth(fInicio.getMonth() + duracion);
      }

      const diaStr = String(fVencimiento.getDate()).padStart(2, '0');
      const mesStr = String(fVencimiento.getMonth() + 1).padStart(2, '0');
      const anioStr = fVencimiento.getFullYear();
      
      setEditFormData(prev => ({ ...prev, fechaVencimiento: `${diaStr}/${mesStr}/${anioStr}` }));
    } catch (err) {
      console.warn("Error interactivo de fecha: ", err);
    }
  }, [editFormData.plan, editFormData.fechaInicio, listadoPlanes]);

  const activarCamaraEditor = () => {
    playSound("click");
    setCameraActive(true);
    
    setTimeout(() => {
      navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        alert("Los permisos de cámara están desactivados o bloqueados.");
        setCameraActive(false);
        console.error(err);
      });
    }, 150);
  };

  const capturarFotoEditor = () => {
    playSound("success");
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const size = Math.min(video.videoWidth, video.videoHeight);
        const startX = (video.videoWidth - size) / 2;
        const startY = (video.videoHeight - size) / 2;

        ctx.drawImage(video, startX, startY, size, size, 0, 0, 600, 600);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setFotoBase64Editor(dataUrl);
      }
    }
    desactivarCamaraEditor();
  };

  const descartarFotoEditor = () => {
    playSound("click");
    setFotoBase64Editor("");
  };

  const desactivarCamaraEditor = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleGuardarCambiosEditor = (e: FormEvent) => {
    e.preventDefault();
    setShowLoader(true);
    setLoaderMessage("Actualizando Miembro");

    const payload = {
      action: "editarClienteCelular",
      dni: editFormData.dni,
      nombre: editFormData.nombre,
      fechaNacimiento: editFormData.fechaNacimiento,
      plan: editFormData.plan,
      fechaInicio: editFormData.fechaInicio,
      fechaVencimiento: editFormData.fechaVencimiento,
      estado: editFormData.estado,
      celular: editFormData.celular,
      fotoBase64: fotoBase64Editor
    };

    fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
      setShowLoader(false);
      if (data.success) {
        alert("¡Miembro modificado con éxito!");
        setEditorModal({ visible: false });
        setAdminSearchQuery("");
        consultarDatosAdmin(); 
      } else {
        alert("Fallo al actualizar: " + data.message);
      }
    })
    .catch(err => {
      setShowLoader(false);
      alert("Error de red al intentar actualizar el usuario.");
      console.error(err);
    });
  };

  useEffect(() => {
    if (activeTab === "admin" && adminSubSection === "graficas" && cachedCharts) {
      const timer = setTimeout(() => {
        renderCharts(cachedCharts);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab, adminSubSection, cachedCharts]);

  const renderCharts = (chartsData: any) => {
    const ChartJSClass = (window as any).Chart;
    if (!ChartJSClass) return;

    if (chartHoursRef.current) chartHoursRef.current.destroy();
    if (chartDaysRef.current) chartDaysRef.current.destroy();

    const hoursEl = document.getElementById("chartHoursCanvas") as HTMLCanvasElement;
    if (hoursEl) {
      const ctxHours = hoursEl.getContext("2d");
      if (ctxHours) {
        chartHoursRef.current = new ChartJSClass(ctxHours, {
          type: "line",
          data: {
            labels: chartsData.horasLabels || ['6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm'],
            datasets: [{
              label: "Asistencias",
              data: chartsData.horasValores || [0, 0, 0, 0, 0, 0, 0, 0, 0],
              borderColor: "#10b981",
              backgroundColor: "rgba(16, 185, 129, 0.08)",
              borderWidth: 3,
              fill: true,
              tension: 0.35,
              pointBackgroundColor: "#10b981",
              pointBorderColor: "#ffffff",
              pointHoverRadius: 6,
              pointRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { 
                grid: { color: "rgba(30, 41, 59, 0.5)" }, 
                ticks: { color: "#94a3b8", font: { family: "Montserrat", size: 10 } } 
              },
              x: { 
                grid: { display: false }, 
                ticks: { color: "#94a3b8", font: { family: "Montserrat", size: 10 } } 
              }
            },
            plugins: { legend: { display: false } }
          }
        });
      }
    }

    const daysEl = document.getElementById("chartDaysCanvas") as HTMLCanvasElement;
    if (daysEl) {
      const ctxDays = daysEl.getContext("2d");
      if (ctxDays) {
        chartDaysRef.current = new ChartJSClass(ctxDays, {
          type: "bar",
          data: {
            labels: chartsData.diasLabels || ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
            datasets: [{
              label: "Usuarios",
              data: chartsData.diasValores || [0, 0, 0, 0, 0, 0, 0],
              backgroundColor: "#10b981",
              borderRadius: 6,
              hoverBackgroundColor: "#34d399"
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { 
                grid: { color: "rgba(30, 41, 59, 0.5)" }, 
                ticks: { color: "#94a3b8", font: { family: "Montserrat", size: 10 } } 
              },
              x: { 
                grid: { display: false }, 
                ticks: { color: "#94a3b8", font: { family: "Montserrat", size: 10 } } 
              }
            },
            plugins: { legend: { display: false } }
          }
        });
      }
    }
  };

  const formatMinutesInside = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const m = mins % 60;
    if (hours > 0) return `${hours}h ${m}m`;
    return `${m} min`;
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-slate-950 overflow-x-hidden relative">
      
      {/* GLOWS DE FONDO */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 -left-64 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 -right-64 w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[120px] animate-pulse" />
      </div>

      {/* NAVBAR / MENÚ SUPERIOR */}
      <header className="bg-slate-900/60 backdrop-blur-xl border-b border-slate-800/40 px-6 py-4 flex justify-between items-center shadow-lg z-10 sticky top-0">
        <div className="flex items-center space-x-3 group cursor-pointer">
          <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 group-hover:border-emerald-500/40 transition duration-300 flex items-center justify-center">
            <img 
              src="logo.png" 
              alt="Logo" 
              className="h-8 w-auto object-contain" 
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const fallbackIcon = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallbackIcon) fallbackIcon.style.display = "block";
              }} 
            />
            <Activity className="h-5 w-5 text-emerald-400 group-hover:scale-110 transition duration-300" />
          </div>
          <span className="text-sm font-extrabold uppercase tracking-widest text-slate-200 group-hover:text-emerald-400 transition duration-300 font-display">
            FITNESS CLUB
          </span>
        </div>
        <nav className="flex space-x-2">
          <button 
            onClick={() => handleTabChange("registro")} 
            className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all duration-300 active:scale-95 cursor-pointer ${
              activeTab === "registro" 
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.35)]" 
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:border-slate-700"
            }`}
          >
            <IdCard className="h-4 w-4" />
            Asistencia
          </button>
          <button 
            onClick={() => handleTabChange("admin")} 
            className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all duration-300 active:scale-95 cursor-pointer ${
              activeTab === "admin" 
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.35)]" 
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:border-slate-700"
            }`}
          >
            <Lock className="h-4 w-4" />
            Admin
          </button>
        </nav>
      </header>

      {/* CONTENEDOR PRINCIPAL */}
      <main className="flex-grow flex items-center justify-center p-4 lg:p-6 z-10 relative">
        <AnimatePresence mode="wait">
          
          {/* ================= VISTA DE REGISTRO (PANTALLA DE ESPERA) ================= */}
          {activeTab === "registro" && !pantallaGigante.visible && (
            <motion.section 
              key="registro-tab"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-xl flex flex-col items-center relative py-4 px-1"
            >
              {/* EFECTOS DE LUZ AMBIENTAL Y RESPLANDOR TRASERO */}
              <motion.div 
                animate={{
                  scale: [1, 1.08, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 bg-gradient-to-tr from-emerald-500/15 via-emerald-400/5 to-teal-500/15 rounded-[32px] blur-[100px] pointer-events-none -z-10"
              />
              <motion.div 
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.6, 0.85, 0.6],
                  rotate: [0, 180, 360]
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-gradient-to-r from-emerald-500/10 to-teal-400/10 rounded-full blur-[80px] pointer-events-none -z-10"
              />
              <div className="absolute top-12 left-1/4 w-32 h-32 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none -z-10 animate-pulse" />

              <div className="w-full glass-panel border border-slate-800/80 p-10 md:p-12 rounded-[32px] text-center shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-500">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-0 group-hover:opacity-100 transition duration-500" />
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/3 to-transparent opacity-0 group-hover:opacity-100 transition duration-700 pointer-events-none" />
                
                {/* Visual Gym Badge con soporte de logo o fallback */}
                <div className="w-24 h-24 mx-auto mb-8 flex items-center justify-center relative">
                  <img 
                    src="logo.png" 
                    alt="Logo" 
                    className="max-h-24 max-w-24 object-contain transition duration-500 hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = "flex";
                    }} 
                  />
                  <div className="hidden w-24 h-24 bg-gradient-to-br from-slate-950 to-slate-900 rounded-full border border-slate-800/80 items-center justify-center relative shadow-inner group-hover:border-emerald-500/30 transition duration-500">
                    <Activity className="h-10 w-10 text-emerald-400 animate-pulse" />
                    <div className="absolute inset-0 rounded-full bg-emerald-500/5 blur-md" />
                  </div>
                </div>
                
                <h2 className="text-xs font-bold tracking-[0.35em] text-emerald-400 uppercase mb-3 font-display">Control de Acceso</h2>
                <h3 className="text-lg font-bold text-slate-400 mb-8 uppercase tracking-wider">Bienvenido al Club</h3>
                
                <form onSubmit={handleRegisterAsistencia} className="relative group/form">
                  <input 
                    type="text" 
                    ref={inputDniRef}
                    value={inputDni}
                    id="input-dni" 
                    placeholder="COLOQUE SU DNI" 
                    maxLength={9}
                    inputMode="numeric"
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setInputDni(val);
                      if (val.length > 0) playSound("keyboard");
                    }}
                    required
                    autoComplete="off"
                    className="w-full bg-slate-950/80 text-white placeholder-slate-700 border-2 border-slate-800/80 focus:border-emerald-500 rounded-2xl pl-6 pr-20 py-5 text-center text-3xl font-black tracking-[0.15em] font-display outline-none transition duration-300 shadow-inner group-hover/form:border-slate-700/80 focus:shadow-[0_0_25px_rgba(16,185,129,0.15)] font-mono"
                  />
                  <button 
                    type="submit" 
                    className="absolute right-3 top-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 w-14 h-14 rounded-xl flex items-center justify-center font-bold transition-all duration-300 shadow-lg hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] active:scale-95 group/btn cursor-pointer"
                  >
                    <ArrowRight className="h-6 w-6 group-hover/btn:translate-x-1 transition duration-300" />
                  </button>
                </form>
                <p className="text-[9px] text-slate-500 mt-6 uppercase tracking-[0.2em] font-medium font-display">Alinee su código o digite manualmente</p>
              </div>
            </motion.section>
          )}

          {/* ================= PANTALLA GIGANTE DE BIENVENIDA ================= */}
          {pantallaGigante.visible && (
            <motion.div 
              key="pantalla-gigante"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/98"
            >
              <div className={`absolute inset-0 transition-all duration-1000 opacity-80 ${
                pantallaGigante.status === "activo"
                  ? pantallaGigante.usuario?.esCumpleanos
                    ? "bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.18)_0%,rgba(2,6,23,1)_80%)]"
                    : "bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.15)_0%,rgba(2,6,23,1)_80%)]"
                  : "bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.15)_0%,rgba(2,6,23,1)_80%)]"
              }`} />
              
              <div className="relative w-full max-w-5xl mx-auto px-6 md:px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-12 md:gap-16 z-10">
                
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
                  className="flex-shrink-0"
                >
                  <div className={`w-64 h-64 md:w-80 md:h-80 lg:w-[380px] lg:h-[380px] rounded-[38px] overflow-hidden border-[6px] bg-slate-900 flex items-center justify-center transition-all duration-700 shadow-2xl relative ${
                    pantallaGigante.status === "activo"
                      ? pantallaGigante.usuario?.esCumpleanos
                        ? "border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.45)]"
                        : "border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.35)]"
                      : "border-rose-500 shadow-[0_0_50px_rgba(244,63,94,0.35)]"
                  }`}>
                    <img 
                      src={pantallaGigante.usuario?.foto || DEFAULT_AVATAR} 
                      alt="Miembro" 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                      }}
                    />
                    
                    {pantallaGigante.status !== "activo" && (
                      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-4">
                        <AlertTriangle className="h-14 w-14 text-rose-500 mb-3 animate-bounce" />
                        <span className="text-xs font-black tracking-widest text-rose-400 uppercase font-display">BLOQUEADO</span>
                      </div>
                    )}
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 250, damping: 22, delay: 0.2 }}
                  className="flex-grow w-full text-center md:text-left space-y-6"
                >
                  <div>
                    {pantallaGigante.status === "activo" ? (
                      pantallaGigante.usuario?.esCumpleanos ? (
                        <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-[0.2em] bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-lg animate-bounce">
                          🎂 ¡FELIZ CUMPLEAÑOS! 🎂
                        </span>
                      ) : pantallaGigante.usuario?.movimiento === "IN" ? (
                        <span className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-[0.15em] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-md font-display">
                          ACCESO AUTORIZADO • INGRESO (IN)
                        </span>
                      ) : (
                        <span className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-[0.15em] bg-orange-500/15 text-orange-400 border border-orange-500/30 shadow-md font-display">
                          ACCESO AUTORIZADO • SALIDA (OUT)
                        </span>
                      )
                    ) : (
                      <span className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-[0.15em] bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-md animate-pulse font-display">
                        ALERTA • ACCESO RECHAZADO
                      </span>
                    )}

                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mt-5 tracking-wide leading-tight text-white capitalize font-display">
                      {pantallaGigante.status === "error" 
                        ? "ERROR DE REGISTRO" 
                        : (pantallaGigante.usuario?.nombre || "DNI NO RECONOCIDO")}
                    </h1>
                  </div>

                  {pantallaGigante.status !== "error" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div className="bg-slate-900/60 border border-slate-800/60 p-4 rounded-2xl backdrop-blur-md shadow-md">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-widest font-display">Plan Contratado</span>
                        <span className="text-lg font-black text-white uppercase mt-1 block tracking-wide">
                          {pantallaGigante.usuario?.plan || "---"}
                        </span>
                      </div>
                      <div className="bg-slate-900/60 border border-slate-800/60 p-4 rounded-2xl backdrop-blur-md shadow-md">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-widest font-display">Vence el Día</span>
                        <span className={`text-lg font-black mt-1 block tracking-wide font-mono ${
                          pantallaGigante.status === "activo" ? "text-emerald-400" : "text-rose-500"
                        }`}>
                          {pantallaGigante.usuario?.fechaVencimiento || "---"}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className={`p-5 rounded-2xl border-l-[6px] italic text-slate-200 text-base md:text-lg backdrop-blur-md shadow-md mt-4 ${
                    pantallaGigante.status === "activo"
                      ? pantallaGigante.usuario?.esCumpleanos
                        ? "bg-amber-950/20 border-amber-500"
                        : "bg-emerald-950/20 border-emerald-500"
                      : "bg-rose-950/20 border-rose-500"
                  }`}>
                    " {pantallaGigante.status === "error" 
                      ? pantallaGigante.errorMsg 
                      : (pantallaGigante.usuario?.message || "Por favor, diríjase al módulo administrativo para regularizar.")} "
                  </div>

                  <div className="text-[9px] text-slate-600 uppercase tracking-[0.25em] pt-2 font-display">
                    Cerrando automáticamente en unos segundos...
                  </div>
                </motion.div>

              </div>
            </motion.div>
          )}

          {/* ================= VISTA DE ADMINISTRACIÓN ================= */}
          {activeTab === "admin" && (
            <motion.section 
              key="admin-tab"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="w-full max-w-[98%] xl:max-w-[96%]"
            >
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-[32px] p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-2xl h-[86vh] flex flex-col justify-between">
                <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-emerald-500/5 blur-[80px]" />

                {/* Dashboard KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-4 border-b border-slate-800/50">
                  <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex items-center space-x-3.5 shadow-inner hover:border-slate-700 hover:bg-slate-950 transition duration-300">
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl text-lg border border-emerald-500/20">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-display">Activos</p>
                      <h3 className="text-xl font-black text-white font-display">{kpis.miembrosActivos}</h3>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex items-center space-x-3.5 shadow-inner hover:border-slate-700 hover:bg-slate-950 transition duration-300">
                    <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl text-lg border border-blue-500/20">
                      <CalendarCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-display">Asistencias</p>
                      <h3 className="text-xl font-black text-white font-display">{kpis.asistenciasHoy}</h3>
                    </div>
                  </div>

                  <div 
                    onClick={() => {
                      playSound("click");
                      setShowDentroGymModal(true);
                    }}
                    className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex items-center space-x-3.5 shadow-inner cursor-pointer hover:border-amber-500/40 hover:bg-slate-950/90 transition-all duration-300 group"
                  >
                    <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl text-lg border border-amber-500/20 group-hover:scale-105 transition duration-300">
                      <Activity className="h-5 w-5 animate-pulse" />
                    </div>
                    <div className="flex-grow">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-display flex items-center gap-1">
                        Dentro GYM
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping inline-block" />
                      </p>
                      <h3 className="text-xl font-black text-white font-display flex items-center justify-between">
                        {kpis.personasDentro}
                        <Eye className="h-3.5 w-3.5 text-slate-600 group-hover:text-amber-400 transition" />
                      </h3>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex items-center space-x-3.5 shadow-inner hover:border-slate-700 hover:bg-slate-950 transition duration-300">
                    <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl text-lg border border-rose-500/20">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-display">Vencidos</p>
                      <h3 className="text-xl font-black text-white font-display">{kpis.vencidosAlerta}</h3>
                    </div>
                  </div>
                </div>

                <div className="flex-grow flex flex-col md:flex-row gap-6 mt-5 overflow-hidden h-full">
                  
                  {/* Navegación lateral */}
                  <div className="w-full md:w-1/4 lg:w-1/5 flex flex-row md:flex-col gap-2 bg-slate-950/40 p-2.5 rounded-2xl border border-slate-800/40 h-auto md:h-full overflow-x-auto md:overflow-x-visible">
                    <button 
                      onClick={() => {
                        playSound("click");
                        setAdminSubSection("buscador");
                      }}
                      className={`w-full px-4 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center gap-3 transition-all duration-300 whitespace-nowrap cursor-pointer ${
                        adminSubSection === "buscador"
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-[0_4px_15px_rgba(16,185,129,0.25)] font-black"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                      }`}
                    >
                      <Search className="h-4 w-4 shrink-0" />
                      Buscador
                    </button>

                    <button 
                      onClick={() => {
                        playSound("click");
                        setAdminSubSection("graficas");
                      }}
                      className={`w-full px-4 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center gap-3 transition-all duration-300 whitespace-nowrap cursor-pointer ${
                        adminSubSection === "graficas"
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-[0_4px_15px_rgba(16,185,129,0.25)] font-black"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                      }`}
                    >
                      <BarChart3 className="h-4 w-4 shrink-0" />
                      Gráficas
                    </button>

                    <button 
                      onClick={() => {
                        playSound("click");
                        setAdminSubSection("alertas");
                      }}
                      className={`w-full px-4 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center gap-3 transition-all duration-300 whitespace-nowrap cursor-pointer ${
                        adminSubSection === "alertas"
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-[0_4px_15px_rgba(16,185,129,0.25)] font-black"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                      }`}
                    >
                      <Bell className="h-4 w-4 shrink-0" />
                      Alertas
                    </button>

                    <button 
                      onClick={() => {
                        playSound("click");
                        setAdminSubSection("inactivos");
                      }}
                      className={`w-full px-4 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center gap-3 transition-all duration-300 whitespace-nowrap cursor-pointer ${
                        adminSubSection === "inactivos"
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-[0_4px_15px_rgba(16,185,129,0.25)] font-black"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                      }`}
                    >
                      <UserMinus className="h-4 w-4 shrink-0" />
                      Inactivos
                    </button>

                    <div className="hidden md:flex flex-grow flex-col justify-end p-2.5">
                      <button 
                        onClick={() => consultarDatosAdmin()}
                        className="w-full py-2.5 border border-slate-800/80 hover:border-slate-700 rounded-xl text-[10px] uppercase font-bold tracking-widest text-slate-500 hover:text-slate-300 flex items-center justify-center gap-2 transition duration-300 active:scale-95 cursor-pointer"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Sincronizar
                      </button>
                    </div>
                  </div>

                  {/* Contenedor dinámico */}
                  <div className="w-full md:w-3/4 lg:w-4/5 bg-slate-950/50 border border-slate-800/80 p-5 md:p-6 rounded-2xl shadow-inner overflow-y-auto h-full max-h-[56vh] relative">
                    
                    {adminSubSection === "buscador" && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <div className="space-y-2.5">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 font-display">
                            <Search className="h-3.5 w-3.5 text-emerald-400" />
                            Buscador en Tiempo Real
                          </h4>
                          <div className="relative">
                            <input 
                              type="text" 
                              value={adminSearchQuery}
                              onChange={(e) => handleSearchInput(e.target.value)}
                              placeholder="Escriba DNI o Nombre para buscar y editar miembro..." 
                              className="w-full bg-slate-900/80 text-white placeholder-slate-700 border border-slate-800 focus:border-emerald-500 rounded-xl pl-12 pr-4 py-3.5 font-semibold outline-none transition text-sm shadow-inner"
                            />
                            <Search className="absolute left-4 top-4 h-4.5 w-4.5 text-slate-600" />
                          </div>
                        </div>

                        {showSearchResults ? (
                          <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800 overflow-hidden shadow-lg animate-fadeIn">
                            {getFilteredClientes().length > 0 ? (
                              getFilteredClientes().map((cliente, idx) => (
                                <div 
                                  key={idx} 
                                  onClick={() => abrirEditorModal(cliente)}
                                  className="flex items-center justify-between p-4 hover:bg-slate-800/50 cursor-pointer transition duration-300 group"
                                >
                                  <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-700 bg-slate-950 flex-shrink-0">
                                      <img 
                                        src={cliente.foto || DEFAULT_AVATAR} 
                                        alt="Foto" 
                                        className="w-full h-full object-cover"
                                        onError={(e) => (e.target as HTMLImageElement).src = DEFAULT_AVATAR}
                                      />
                                    </div>
                                    <div>
                                      <h5 className="font-bold text-sm text-white group-hover:text-emerald-400 transition">{cliente.nombre}</h5>
                                      <p className="text-xs text-slate-400 mt-0.5">DNI: {cliente.dni} • Plan: {cliente.plan}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                      cliente.estado === "Activo" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                                    }`}>
                                      {cliente.estado}
                                    </span>
                                    <p className="text-[10px] text-slate-500 mt-1 font-mono">Vence: {cliente.fechaVencimiento}</p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-8 text-center text-slate-500 font-bold uppercase tracking-wider text-xs">
                                ❌ Ningún miembro coincide con su búsqueda
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 font-display">
                              <CalendarCheck className="h-3.5 w-3.5 text-emerald-400" />
                              Últimos Ingresos Registrados Hoy
                            </h4>
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                                      <th className="p-4 uppercase font-bold tracking-wider">Miembro</th>
                                      <th className="p-4 uppercase font-bold tracking-wider">Hora</th>
                                      <th className="p-4 uppercase font-bold tracking-wider">Movimiento</th>
                                      <th className="p-4 uppercase font-bold tracking-wider text-right">Membresía</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800">
                                    {ultimosIngresos.length > 0 ? (
                                      ultimosIngresos.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-900/50 transition">
                                          <td className="p-4 flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-800 flex-shrink-0 bg-slate-950">
                                              <img src={item.foto || DEFAULT_AVATAR} alt="" className="w-full h-full object-cover" onError={(e) => (e.target as HTMLImageElement).src = DEFAULT_AVATAR} />
                                            </div>
                                            <span className="font-bold text-white capitalize">{item.nombre}</span>
                                          </td>
                                          <td className="p-4 font-mono text-slate-400">{item.hora}</td>
                                          <td className="p-4">
                                            <span className={`inline-block px-2.5 py-0.5 rounded text-[9px] font-black tracking-wide ${
                                              item.movimiento === "IN" ? "bg-emerald-500/10 text-emerald-400" : "bg-orange-500/10 text-orange-400"
                                            }`}>
                                              {item.movimiento || "IN"}
                                            </span>
                                          </td>
                                          <td className="p-4 text-right text-slate-300 font-medium">{item.plan}</td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td colSpan={4} className="p-8 text-center text-slate-500 uppercase font-bold tracking-widest text-[10px]">
                                          Todavía no hay ingresos reportados hoy.
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {adminSubSection === "graficas" && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                      >
                        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl shadow-lg flex flex-col justify-between">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 font-display flex items-center gap-1.5">
                            <Activity className="h-4 w-4 text-emerald-400" />
                            Afluencia por Horario Hoy
                          </h4>
                          <div className="h-48 relative">
                            <canvas id="chartHoursCanvas" />
                          </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl shadow-lg flex flex-col justify-between">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 font-display flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-emerald-400" />
                            Asistencias por Día de la Semana
                          </h4>
                          <div className="h-48 relative">
                            <canvas id="chartDaysCanvas" />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {adminSubSection === "alertas" && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                      >
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-display flex items-center gap-2">
                          <Bell className="h-3.5 w-3.5 text-emerald-400" />
                          Membresías Próximas a Vencer (7 días)
                        </h4>
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                                  <th className="p-4 uppercase font-bold tracking-wider">Nombre</th>
                                  <th className="p-4 uppercase font-bold tracking-wider">Celular</th>
                                  <th className="p-4 uppercase font-bold tracking-wider">Plan</th>
                                  <th className="p-4 uppercase font-bold tracking-wider text-right">Vence el Día</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800">
                                {proximosVencer.length > 0 ? (
                                  proximosVencer.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/20 transition">
                                      <td className="p-4 font-bold text-white capitalize">{item.nombre}</td>
                                      <td className="p-4 font-mono text-slate-400">
                                        {item.celular ? (
                                          <a href={`https://wa.me/51${item.celular}`} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline flex items-center gap-1">
                                            <Phone className="h-3 w-3" />
                                            {item.celular}
                                          </a>
                                        ) : "---"}
                                      </td>
                                      <td className="p-4 text-slate-300">{item.plan}</td>
                                      <td className="p-4 text-right font-black text-amber-400 font-mono">{item.fechaVencimiento}</td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-500 uppercase font-bold tracking-widest text-[10px]">
                                      Sin membresías próximas a vencer esta semana.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {adminSubSection === "inactivos" && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                      >
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-display flex items-center gap-2">
                          <UserMinus className="h-3.5 w-3.5 text-emerald-400" />
                          Clientes Inactivos (Más de 10 días sin asistir)
                        </h4>
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                                  <th className="p-4 uppercase font-bold tracking-wider">Nombre</th>
                                  <th className="p-4 uppercase font-bold tracking-wider">Celular</th>
                                  <th className="p-4 uppercase font-bold tracking-wider">Último Ingreso</th>
                                  <th className="p-4 uppercase font-bold tracking-wider text-right">Días Ausente</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800">
                                {inactivosList.length > 0 ? (
                                  inactivosList.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/20 transition">
                                      <td className="p-4 font-bold text-white capitalize">{item.nombre}</td>
                                      <td className="p-4 font-mono text-slate-400">
                                        {item.celular ? (
                                          <a href={`https://wa.me/51${item.celular}`} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline flex items-center gap-1">
                                            <Phone className="h-3 w-3" />
                                            {item.celular}
                                          </a>
                                        ) : "---"}
                                      </td>
                                      <td className="p-4 text-slate-400 font-mono">{item.ultimoRegistro || "Nunca"}</td>
                                      <td className="p-4 text-right font-black text-rose-400 font-mono">{item.diasInactivo} días</td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-500 uppercase font-bold tracking-widest text-[10px]">
                                      ¡Excelente! No hay clientes inactivos reportados.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </motion.div>
                    )}

                  </div>

                </div>

              </div>
            </motion.section>
          )}

        </AnimatePresence>
      </main>

      {/* ================= MODAL DE EDICIÓN EN DIÁLOGO (POPUP) ================= */}
      {editorModal.visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-800/80 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col my-8"
          >
            <div className="bg-slate-950/80 border-b border-slate-800/60 p-5 flex justify-between items-center">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-300 font-display flex items-center gap-2">
                <IdCard className="h-4.5 w-4.5 text-emerald-400" />
                Actualizar Miembro
              </h3>
              <button 
                onClick={cerrarEditorModal} 
                className="text-slate-500 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarCambiosEditor} className="p-6 md:p-8 space-y-6">
              
              <div className="flex flex-col md:flex-row items-center gap-6 pb-2">
                <div className="relative">
                  <div className="w-32 h-32 md:w-36 md:h-36 rounded-2xl overflow-hidden border-2 border-slate-800 bg-slate-950 flex items-center justify-center relative group">
                    <img 
                      src={fotoBase64Editor || DEFAULT_AVATAR} 
                      alt="Socio" 
                      className="w-full h-full object-cover" 
                      onError={(e) => (e.target as HTMLImageElement).src = DEFAULT_AVATAR}
                    />
                    {cameraActive && (
                      <div className="absolute inset-0 bg-black z-10 rounded-2xl overflow-hidden">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={capturarFotoEditor}
                          className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 font-bold p-2 rounded-full hover:bg-emerald-400 shadow-md active:scale-95 transition"
                          title="Capturar Foto"
                        >
                          <Camera className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {!cameraActive ? (
                    <button 
                      type="button" 
                      onClick={activarCamaraEditor}
                      className="px-4 py-2 bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-200 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition"
                    >
                      <Camera className="h-4 w-4" />
                      Tomar Foto
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      onClick={desactivarCamaraEditor}
                      className="px-4 py-2 bg-rose-500/20 border border-rose-500/40 text-rose-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition"
                    >
                      <X className="h-4 w-4" />
                      Cancelar Cámara
                    </button>
                  )}
                  {fotoBase64Editor && (
                    <button 
                      type="button" 
                      onClick={descartarFotoEditor}
                      className="px-4 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition"
                    >
                      Descartar Foto
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest font-display">DNI (Identificación)</label>
                  <input type="text" readOnly value={editFormData.dni} className="w-full bg-slate-950 border border-slate-800 text-slate-500 rounded-xl px-4 py-3 text-sm font-bold font-mono outline-none cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest font-display">Nombre Completo</label>
                  <input type="text" value={editFormData.nombre} onChange={(e) => handleEditorFormChange("nombre", e.target.value)} required className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white rounded-xl px-4 py-3 text-sm font-bold outline-none transition" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest font-display">Fecha de Nacimiento (DD/MM/AAAA)</label>
                  <input type="text" value={editFormData.fechaNacimiento} onChange={(e) => handleEditorFormChange("fechaNacimiento", e.target.value)} placeholder="01/01/1990" className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white rounded-xl px-4 py-3 text-sm font-bold font-mono outline-none transition" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest font-display">Celular de Contacto</label>
                  <input type="text" value={editFormData.celular} onChange={(e) => handleEditorFormChange("celular", e.target.value)} placeholder="999888777" className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white rounded-xl px-4 py-3 text-sm font-bold font-mono outline-none transition" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest font-display">Plan de Membresía</label>
                  <select value={editFormData.plan} onChange={(e) => handleEditorFormChange("plan", e.target.value)} className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white rounded-xl px-4 py-3 text-sm font-bold outline-none transition cursor-pointer">
                    {listadoPlanes.map((plan, idx) => (
                      <option key={idx} value={plan.nombre}>{plan.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest font-display">Estado</label>
                  <select value={editFormData.estado} onChange={(e) => handleEditorFormChange("estado", e.target.value)} className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white rounded-xl px-4 py-3 text-sm font-bold outline-none transition cursor-pointer">
                    <option value="Activo">Activo</option>
                    <option value="Vencido">Vencido</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest font-display">Fecha de Inicio (DD/MM/AAAA)</label>
                  <input type="text" value={editFormData.fechaInicio} onChange={(e) => handleEditorFormChange("fechaInicio", e.target.value)} placeholder="01/01/2026" className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white rounded-xl px-4 py-3 text-sm font-bold font-mono outline-none transition" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest font-display">Fecha de Vencimiento</label>
                  <input type="text" value={editFormData.fechaVencimiento} onChange={(e) => handleEditorFormChange("fechaVencimiento", e.target.value)} className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white rounded-xl px-4 py-3 text-sm font-bold font-mono outline-none transition" />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/60 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={cerrarEditorModal}
                  className="px-5 py-3 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition active:scale-95"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg active:scale-95 transition cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  Guardar Cambios
                </button>
              </div>

            </form>
          </motion.div>
          <canvas ref={canvasRef} style={{ display: "none" }} width={600} height={600} />
        </div>
      )}

      {/* ================= MODAL: SOCIOS DENTRO DEL GYM ================= */}
      {showDentroGymModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-800/80 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[70vh]"
          >
            <div className="bg-slate-950/80 border-b border-slate-800/60 p-5 flex justify-between items-center">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-300 font-display flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-emerald-400" />
                Miembros en Sala Activos ({personasDentroList.length})
              </h3>
              <button 
                onClick={() => setShowDentroGymModal(false)} 
                className="text-slate-500 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-grow divide-y divide-slate-800/60">
              {personasDentroList.length > 0 ? (
                personasDentroList.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-800 bg-slate-950 flex-shrink-0">
                        <img 
                          src={p.foto || DEFAULT_AVATAR} 
                          alt="" 
                          className="w-full h-full object-cover" 
                          onError={(e) => (e.target as HTMLImageElement).src = DEFAULT_AVATAR} 
                        />
                      </div>
                      <div>
                        <h5 className="font-bold text-sm text-white capitalize">{p.nombre}</h5>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 font-mono">
                          <Hourglass className="h-3.5 w-3.5 text-slate-600" />
                          Tiempo: {formatMinutesInside(p.minutosDentro)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block tracking-wider font-display">Ingreso</span>
                      <span className="text-xs font-black text-emerald-400 font-mono mt-0.5 inline-block">{p.horaIngreso}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">
                  📭 No hay nadie entrenando en este momento
                </div>
              )}
            </div>

            <div className="bg-slate-950/80 p-5 border-t border-slate-800/60 flex justify-end">
              <button 
                onClick={() => setShowDentroGymModal(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition active:scale-95"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ================= PANTALLA DE CARGA (LOADING OVERLAY) ================= */}
      {showLoader && (
        <div 
          className="fixed inset-0 bg-slate-950/95 flex flex-col items-center justify-center z-50 backdrop-blur-sm"
        >
          <div className="logo-container-3d mb-8">
            <div className="w-24 h-24 flex items-center justify-center relative">
              <img 
                src="logo.png" 
                alt="Logo" 
                className="max-h-24 max-w-24 object-contain animate-pulse" 
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
              <div className="hidden w-24 h-24 bg-gradient-to-br from-slate-950 to-slate-900 rounded-full border border-slate-800 items-center justify-center relative logo-3d shadow-xl">
                <Activity className="h-10 w-10 text-emerald-400" />
                <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-xl" />
              </div>
            </div>
          </div>
          <p className="text-emerald-400 text-xs uppercase tracking-[0.35em] font-black animate-pulse font-display">
            {loaderMessage}
          </p>
          <div className="mt-4 flex space-x-1.5">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-600 text-center py-4 border-t border-slate-900 text-[10px] uppercase tracking-widest font-bold font-display">
        Fitness Club • Sistema de Gestión e Inteligencia de Datos
      </footer>

    </div>
  );
}
