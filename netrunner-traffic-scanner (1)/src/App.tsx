import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  Terminal, 
  BarChart3, 
  Video, 
  Cpu, 
  AlertTriangle,
  RefreshCw,
  Car,
  Bike,
  Bus,
  Truck,
  ArrowLeftRight,
  Zap,
  Users,
  History,
  TrendingUp
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';

interface TrafficStats {
  current_frame: {
    people: number;
    cars: number;
    motorcycles: number;
    buses: number;
    trucks: number;
  };
  total_detected: {
    people: number;
    vehicles: number;
  };
  unique_objects: {
    people: number;
    vehicles: number;
  };
  flow_rate: {
    people_per_min: number;
    vehicles_per_min: number;
  };
  total: {
    entered: number;
    exited: number;
    current: number;
  };
  types: {
    car: { entered: number; exited: number; current: number };
    motorcycle: { entered: number; exited: number; current: number };
    bus: { entered: number; exited: number; current: number };
    truck: { entered: number; exited: number; current: number };
  };
  direction: {
    left: number;
    right: number;
  };
  avg_speed: number;
}

const INITIAL_STATS: TrafficStats = {
  current_frame: { people: 0, cars: 0, motorcycles: 0, buses: 0, trucks: 0 },
  total_detected: { people: 0, vehicles: 0 },
  unique_objects: { people: 0, vehicles: 0 },
  flow_rate: { people_per_min: 0, vehicles_per_min: 0 },
  total: { entered: 0, exited: 0, current: 0 },
  types: {
    car: { entered: 0, exited: 0, current: 0 },
    motorcycle: { entered: 0, exited: 0, current: 0 },
    bus: { entered: 0, exited: 0, current: 0 },
    truck: { entered: 0, exited: 0, current: 0 },
  },
  direction: { left: 0, right: 0 },
  avg_speed: 0,
};

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendUrl, setBackendUrl] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [stats, setStats] = useState<TrafficStats>(INITIAL_STATS);
  const [history, setHistory] = useState<any[]>([]);
  const statsInterval = useRef<NodeJS.Timeout | null>(null);

  const handleConnect = async (e: React.FormEvent) => {
  e.preventDefault();

  const trimmedBackend = backendUrl.trim();
  const trimmedStream = streamUrl.trim();

  if (!trimmedBackend) {
    setError('BACKEND URL REQUIRED');
    return;
  }
  if (!trimmedStream) {
    setError('STREAM URL REQUIRED');
    return;
  }

  setIsLoading(true);
  setError(null);

  try {
    // Убираем слеш в конце, если есть
    let backend = trimmedBackend;
    if (backend.endsWith('/')) backend = backend.slice(0, -1);

    // Обновляем состояние очищенным URL
    setBackendUrl(backend);

    const apiUrl = `${backend}/set_stream?url=${encodeURIComponent(trimmedStream)}`;

    console.log('[CONNECT] Отправляем запрос:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    console.log('[CONNECT] Ответ от бэкенда:', data);

    if (data.status !== 'ok') {
      throw new Error(data.error || 'Backend вернул ошибку');
    }

    // Успех — подключаем стрим и статистику
    setIsConnected(true);
    startStatsPolling();

  } catch (err: any) {
    console.error('[CONNECT] Ошибка:', err);
    setError(`ПОДКЛЮЧЕНИЕ НЕ УДАЛОСЬ: ${err.message}`);
  } finally {
    setIsLoading(false);
  }
  };

  const startStatsPolling = () => {
    if (statsInterval.current) clearInterval(statsInterval.current);
    
    statsInterval.current = setInterval(async () => {
      try {
        const response = await fetch(`${backendUrl}/stats`);
        if (response.ok) {
          const data = await response.json();
          // Валидация структуры данных
          if (data && (data.total || data.current_frame)) {
            setStats(prev => ({ ...prev, ...data }));
            
            // Update history for line chart
            setHistory(prev => {
              const newPoint = {
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                people: data.current_frame?.people ?? data.total?.current ?? 0,
                vehicles: (data.current_frame?.cars ?? 0) + (data.current_frame?.motorcycles ?? 0) + (data.current_frame?.buses ?? 0) + (data.current_frame?.trucks ?? 0) || (data.total?.current ?? 0)
              };
              const updated = [...prev, newPoint];
              return updated.slice(-20); // Keep last 20 points
            });
          }
        } else {
          // Mock data for demo
          setStats(prev => {
            const mockCurrent = {
              people: Math.floor(Math.random() * 5),
              cars: Math.floor(Math.random() * 8),
              motorcycles: Math.floor(Math.random() * 3),
              buses: Math.random() > 0.8 ? 1 : 0,
              trucks: Math.random() > 0.9 ? 1 : 0
            };
            
            const totalVehicles = mockCurrent.cars + mockCurrent.motorcycles + mockCurrent.buses + mockCurrent.trucks;

            const newStats = {
              ...prev,
              current_frame: mockCurrent,
              total_detected: {
                people: (prev.total_detected?.people || 0) + (mockCurrent.people > 0 ? 1 : 0),
                vehicles: (prev.total_detected?.vehicles || 0) + (totalVehicles > 0 ? 1 : 0)
              },
              unique_objects: {
                people: (prev.unique_objects?.people || 0) + (Math.random() > 0.9 ? 1 : 0),
                vehicles: (prev.unique_objects?.vehicles || 0) + (Math.random() > 0.8 ? 1 : 0)
              },
              flow_rate: {
                people_per_min: 5 + Math.random() * 10,
                vehicles_per_min: 15 + Math.random() * 20
              },
              total: {
                entered: (prev.total?.entered || 0) + Math.floor(Math.random() * 2),
                exited: (prev.total?.exited || 0) + Math.floor(Math.random() * 2),
                current: mockCurrent.people + totalVehicles
              },
              types: {
                car: { 
                  entered: (prev.types?.car?.entered || 0) + (mockCurrent.cars > 0 ? 1 : 0), 
                  exited: (prev.types?.car?.exited || 0), 
                  current: mockCurrent.cars 
                },
                motorcycle: { 
                  entered: (prev.types?.motorcycle?.entered || 0) + (mockCurrent.motorcycles > 0 ? 1 : 0), 
                  exited: (prev.types?.motorcycle?.exited || 0), 
                  current: mockCurrent.motorcycles 
                },
                bus: { 
                  entered: (prev.types?.bus?.entered || 0) + (mockCurrent.buses > 0 ? 1 : 0), 
                  exited: (prev.types?.bus?.exited || 0), 
                  current: mockCurrent.buses 
                },
                truck: { 
                  entered: (prev.types?.truck?.entered || 0) + (mockCurrent.trucks > 0 ? 1 : 0), 
                  exited: (prev.types?.truck?.exited || 0), 
                  current: mockCurrent.trucks 
                },
              },
              direction: {
                left: (prev.direction?.left || 0) + Math.floor(Math.random() * 2),
                right: (prev.direction?.right || 0) + Math.floor(Math.random() * 2),
              },
              avg_speed: 45 + Math.random() * 10
            };

            // Update history in mock mode too
            setHistory(h => {
              const newPoint = {
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                people: mockCurrent.people,
                vehicles: totalVehicles
              };
              return [...h, newPoint].slice(-20);
            });

            return newStats;
          });
        }
      } catch (err) {
        console.error('[STATS] Error:', err);
      }
    }, 1000);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    if (statsInterval.current) clearInterval(statsInterval.current);
    setStats(INITIAL_STATS);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* CRT Overlay */}
      <div className="scanlines fixed inset-0 pointer-events-none z-50 opacity-20"></div>
      
      <AnimatePresence mode="wait">
        {!isConnected ? (
          <motion.div 
            key="login"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex-1 flex items-center justify-center p-6"
          >
            <div className="w-full max-w-md space-y-8 bg-black/60 p-8 cyber-border backdrop-blur-md relative">
              {/* Decorative corners */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-cyber-yellow"></div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-cyber-yellow"></div>

              <div className="text-center space-y-2">
                <h1 className="text-4xl md:text-5xl font-black font-orbitron cyber-glow-text glitch-hover tracking-tighter italic">
                  NETRUNNER
                </h1>
                <h2 className="text-xl font-orbitron text-cyber-magenta tracking-[0.3em] font-bold">
                  TRAFFIC SCANNER
                </h2>
              </div>

              <form onSubmit={handleConnect} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-widest text-cyber-cyan/70 flex items-center gap-2">
                      <Terminal size={14} /> УЗЕЛ ДОСТУПА БЭКЕНДА
                    </label>
                    <input 
                      type="text" 
                      placeholder="https://xxxx.ngrok-free.app"
                      className="w-full cyber-input"
                      value={backendUrl}
                      onChange={(e) => setBackendUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-widest text-cyber-cyan/70 flex items-center gap-2">
                      <Video size={14} /> URL НЕЙРОПОТОКА
                    </label>
                    <input 
                      type="text" 
                      placeholder="https://stream.provider.com/live.m3u8"
                      className="w-full cyber-input"
                      value={streamUrl}
                      onChange={(e) => setStreamUrl(e.target.value)}
                    />
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-cyber-magenta font-vt323 text-lg flex items-center gap-2 bg-cyber-magenta/10 p-2 border-l-2 border-cyber-magenta"
                  >
                    <AlertTriangle size={18} /> ОШИБКА ПОДКЛЮЧЕНИЯ — ПРОВЕРЬТЕ URL
                  </motion.div>
                )}

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className={`w-full cyber-button bg-cyber-magenta text-black hover:bg-cyber-magenta/80 flex items-center justify-center gap-3 group disabled:opacity-50`}
                >
                  {isLoading ? (
                    <RefreshCw className="animate-spin" />
                  ) : (
                    <>
                      <Zap size={20} className="group-hover:animate-pulse" />
                      ИНИЦИАЛИЗИРОВАТЬ СВЯЗЬ
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-cyber-cyan/40 font-mono uppercase tracking-tighter">
                  Поддерживаются: YouTube Live, Twitch, VK (HLS), публичные IP-камеры, нейросети
                </p>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col p-4 md:p-6 gap-6"
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-cyber-cyan/20 pb-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-cyber-cyan/10 border border-cyber-cyan/30">
                  <Activity className="text-cyber-cyan animate-pulse" />
                </div>
                <div>
                  <h1 className="text-2xl font-orbitron font-black italic tracking-tighter cyber-glow-text">
                    МОНИТОРИНГ ТРАФИКА МЕГАПОЛИСА
                  </h1>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-cyber-cyan/60">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
                    СВЯЗЬ АКТИВНА: {backendUrl}
                  </div>
                </div>
              </div>
              <button 
                onClick={handleDisconnect}
                className="text-xs font-orbitron border border-cyber-magenta/50 px-4 py-2 text-cyber-magenta hover:bg-cyber-magenta hover:text-black transition-all clip-path-cyber"
              >
                ЗАВЕРШИТЬ СЕССИЮ
              </button>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
              {/* Video Feed */}
              <div className="lg:col-span-7 space-y-4">
                <div className="relative aspect-video bg-black cyber-border overflow-hidden group">
                  <img 
                    src={`${backendUrl}/video_feed`} 
                    alt="Traffic Stream" 
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay UI */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <div className="bg-black/80 px-3 py-1 border-l-2 border-cyber-yellow text-[10px] font-mono text-cyber-yellow">
                      REC // NEURAL_SCAN_01
                    </div>
                    <div className="bg-black/80 px-3 py-1 border-l-2 border-cyber-cyan text-[10px] font-mono text-cyber-cyan">
                      LATENCY: 142ms
                    </div>
                  </div>

                  <div className="absolute bottom-4 right-4 bg-black/80 px-3 py-1 border-r-2 border-cyber-magenta text-[10px] font-mono text-cyber-magenta">
                    SECURE_NODE_X9
                  </div>

                  {/* Corner Decorations */}
                  <div className="absolute top-0 right-0 w-12 h-12 border-t border-r border-cyber-cyan/30"></div>
                  <div className="absolute bottom-0 left-0 w-12 h-12 border-b border-l border-cyber-cyan/30"></div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-3 space-y-6">
                <div className="bg-black/40 p-5 cyber-border space-y-4">
                  <h3 className="font-orbitron text-sm font-bold text-cyber-cyan flex items-center gap-2 border-b border-cyber-cyan/20 pb-2">
                    <Cpu size={16} /> ХАРАКТЕРИСТИКИ ПОТОКА
                  </h3>
                  <div className="space-y-3 font-vt323 text-xl">
                    <div className="flex justify-between">
                      <span className="text-cyber-cyan/60">РАЗРЕШЕНИЕ:</span>
                      <span className="text-cyber-yellow">1920x1080</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyber-cyan/60">FPS:</span>
                      <span className="text-cyber-yellow">29.97</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyber-cyan/60">КОДИРОВАНИЕ:</span>
                      <span className="text-cyber-yellow">H.264 / NVENC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyber-cyan/60">БИТРЕЙТ:</span>
                      <span className="text-cyber-yellow">4.2 MBPS</span>
                    </div>
                  </div>
                </div>

                <div className="bg-black/40 p-5 cyber-border-magenta space-y-4">
                  <h3 className="font-orbitron text-sm font-bold text-cyber-magenta flex items-center gap-2 border-b border-cyber-magenta/20 pb-2">
                    <BarChart3 size={16} /> СТАТУС НЕЙРОСКАНИРОВАНИЯ
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-1 bg-cyber-magenta/20 overflow-hidden">
                      <motion.div 
                        className="h-full bg-cyber-magenta"
                        animate={{ width: ["0%", "100%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-cyber-magenta">АНАЛИЗ...</span>
                  </div>
                  <p className="text-[10px] font-mono text-cyber-cyan/40 leading-tight">
                    МОДЕЛЬ ОБНАРУЖЕНИЯ: YOLOv8_NC_TRAFFIC_V2.1
                    ВРЕМЯ ВЫВОДА: 12ms
                    ПОРОГ УВЕРЕННОСТИ: 0.65
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Stats Section */}
            <div className="space-y-6 pb-12">
              {/* Live Counters */}
              <div className="space-y-4">
                <h2 className="font-orbitron text-xl font-black italic text-cyber-cyan flex items-center gap-3">
                  <Activity className="text-cyber-magenta" /> ОБЪЕКТЫ В КАДРЕ
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { label: 'ЛЮДИ', icon: Users, color: 'text-cyber-yellow', value: stats.current_frame?.people ?? 0 },
                    { label: 'АВТО', icon: Car, color: 'text-cyber-cyan', value: stats.current_frame?.cars ?? 0 },
                    { label: 'МОТО', icon: Bike, color: 'text-cyber-magenta', value: stats.current_frame?.motorcycles ?? 0 },
                    { label: 'АВТОБУСЫ', icon: Bus, color: 'text-cyber-yellow', value: stats.current_frame?.buses ?? 0 },
                    { label: 'ГРУЗОВИКИ', icon: Truck, color: 'text-cyber-purple', value: stats.current_frame?.trucks ?? 0 },
                  ].map((item) => (
                    <div key={item.label} className="bg-black/40 p-4 cyber-border border-white/5 flex flex-col items-center justify-center gap-2">
                      <item.icon size={24} className={item.color} />
                      <div className="text-3xl font-vt323 leading-none">{item.value}</div>
                      <span className="text-[10px] font-bold font-orbitron tracking-tighter opacity-60">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Analytics Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Charts Section */}
                <div className="space-y-6">
                  {/* Line Chart: Flow over time */}
                  <div className="bg-black/40 p-5 cyber-border space-y-4 h-[300px]">
                    <h3 className="font-orbitron text-sm font-bold text-cyber-cyan flex items-center gap-2 border-b border-cyber-cyan/20 pb-2">
                      <TrendingUp size={16} /> ДИНАМИКА ПОТОКА (LIVE)
                    </h3>
                    <div className="w-full h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={history}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                          <XAxis 
                            dataKey="time" 
                            stroke="#00ffff50" 
                            fontSize={10} 
                            tickFormatter={(val) => val.split(':')[2]} 
                          />
                          <YAxis stroke="#00ffff50" fontSize={10} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#000', border: '1px solid #00ffff50', fontSize: '12px' }}
                            itemStyle={{ color: '#00ffff' }}
                          />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                          <Line type="monotone" dataKey="people" name="Люди" stroke="#ffff00" strokeWidth={2} dot={false} isAnimationActive={false} />
                          <Line type="monotone" dataKey="vehicles" name="Транспорт" stroke="#00ffff" strokeWidth={2} dot={false} isAnimationActive={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Bar Chart: Object Types */}
                  <div className="bg-black/40 p-5 cyber-border space-y-4 h-[300px]">
                    <h3 className="font-orbitron text-sm font-bold text-cyber-cyan flex items-center gap-2 border-b border-cyber-cyan/20 pb-2">
                      <BarChart3 size={16} /> РАСПРЕДЕЛЕНИЕ ТИПОВ
                    </h3>
                    <div className="w-full h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'Люди', count: stats.current_frame?.people ?? 0, color: '#ffff00' },
                          { name: 'Авто', count: stats.current_frame?.cars ?? 0, color: '#00ffff' },
                          { name: 'Мото', count: stats.current_frame?.motorcycles ?? 0, color: '#ff00ff' },
                          { name: 'Автобус', count: stats.current_frame?.buses ?? 0, color: '#ffff00' },
                          { name: 'Грузовик', count: stats.current_frame?.trucks ?? 0, color: '#bc13fe' },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                          <XAxis dataKey="name" stroke="#00ffff50" fontSize={10} />
                          <YAxis stroke="#00ffff50" fontSize={10} />
                          <Tooltip 
                            cursor={{ fill: '#ffffff05' }}
                            contentStyle={{ backgroundColor: '#000', border: '1px solid #00ffff50', fontSize: '12px' }}
                          />
                          <Bar dataKey="count" name="Кол-во">
                            {[0,1,2,3,4].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#ffff00', '#00ffff', '#ff00ff', '#ffff00', '#bc13fe'][index]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Extended Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Total Detected */}
                  <div className="bg-cyber-blue/40 p-5 cyber-border space-y-4">
                    <h3 className="font-orbitron text-xs font-bold text-cyber-cyan flex items-center gap-2 uppercase tracking-widest">
                      <History size={14} /> Всего обнаружено
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="text-3xl font-vt323 text-cyber-yellow">{stats.total_detected?.people ?? 0}</div>
                        <div className="text-[8px] font-mono text-white/40 uppercase">Людей</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-3xl font-vt323 text-cyber-cyan">{stats.total_detected?.vehicles ?? 0}</div>
                        <div className="text-[8px] font-mono text-white/40 uppercase">Транспорта</div>
                      </div>
                    </div>
                  </div>

                  {/* Unique Objects */}
                  <div className="bg-cyber-blue/40 p-5 cyber-border space-y-4">
                    <h3 className="font-orbitron text-xs font-bold text-cyber-magenta flex items-center gap-2 uppercase tracking-widest">
                      <Zap size={14} /> Уникальные объекты
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="text-3xl font-vt323 text-cyber-magenta">{stats.unique_objects?.people ?? 0}</div>
                        <div className="text-[8px] font-mono text-white/40 uppercase">Людей</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-3xl font-vt323 text-cyber-cyan">{stats.unique_objects?.vehicles ?? 0}</div>
                        <div className="text-[8px] font-mono text-white/40 uppercase">Транспорта</div>
                      </div>
                    </div>
                  </div>

                  {/* Flow Rate */}
                  <div className="bg-cyber-blue/40 p-5 cyber-border space-y-4 col-span-1 md:col-span-2">
                    <h3 className="font-orbitron text-xs font-bold text-cyber-yellow flex items-center gap-2 uppercase tracking-widest">
                      <TrendingUp size={14} /> Интенсивность потока
                    </h3>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-cyber-yellow/10 border border-cyber-yellow/30">
                          <Users size={20} className="text-cyber-yellow" />
                        </div>
                        <div>
                          <div className="text-2xl font-vt323 text-cyber-yellow">
                            {(stats.flow_rate?.people_per_min ?? 0).toFixed(1)}
                          </div>
                          <div className="text-[8px] font-mono text-white/40 uppercase">Чел / Мин</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-cyber-cyan/10 border border-cyber-cyan/30">
                          <Car size={20} className="text-cyber-cyan" />
                        </div>
                        <div>
                          <div className="text-2xl font-vt323 text-cyber-cyan">
                            {(stats.flow_rate?.vehicles_per_min ?? 0).toFixed(1)}
                          </div>
                          <div className="text-[8px] font-mono text-white/40 uppercase">Транспорт / Мин</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Legacy Stats (Condensed) */}
                  <div className="bg-black/40 p-4 cyber-border border-white/5 col-span-1 md:col-span-2 grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-[8px] font-mono text-cyber-cyan/60 uppercase mb-1">Средняя скорость</div>
                      <div className="text-xl font-vt323 text-cyber-magenta">{(stats.avg_speed ?? 0).toFixed(1)} <span className="text-[10px]">PX/F</span></div>
                    </div>
                    <div className="text-center">
                      <div className="text-[8px] font-mono text-cyber-cyan/60 uppercase mb-1">Связь</div>
                      <div className="text-xl font-vt323 text-green-500 uppercase">Оптимально</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[8px] font-mono text-cyber-cyan/60 uppercase mb-1">Вектор (Л/П)</div>
                      <div className="text-xl font-vt323 text-cyber-cyan">{stats.direction?.left ?? 0} / {stats.direction?.right ?? 0}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center gap-6"
          >
            <div className="relative w-24 h-24">
              <motion.div 
                className="absolute inset-0 border-4 border-cyber-cyan/20 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
              <motion.div 
                className="absolute inset-0 border-t-4 border-cyber-cyan rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Terminal className="text-cyber-cyan animate-pulse" size={32} />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-orbitron font-bold text-cyber-cyan cyber-glow-text animate-pulse">
                УСТАНОВКА НЕЙРОСВЯЗИ
              </h3>
              <p className="text-[10px] font-mono text-cyber-cyan/60 uppercase tracking-[0.5em]">
                Обход системных фаерволов...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
