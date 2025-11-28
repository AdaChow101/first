import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  PlayCircle, 
  LayoutDashboard,
  Calculator,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  Upload,
  Menu,
  X,
  Video,
  RefreshCw // 新增图标
} from 'lucide-react';
// 引入图表库 (如果本地报错，请运行 npm install recharts)
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// --- 配置：后端 API 地址 ---
const API_BASE_URL = 'http://127.0.0.1:8000';

// --- 1. 模拟数据 (作为断网时的备用数据) ---
const AI_MOCK_DATA = [
  { day: 'Day 1', score: 142, projected: 145 },
  { day: 'Day 3', score: 145, projected: 148 },
  { day: 'Day 5', score: 148, projected: 152 },
  { day: 'Day 7', score: 150, projected: 155 },
  { day: 'Day 10', score: 153, projected: 158 },
  { day: 'Day 14', score: 158, projected: 162 },
  { day: 'Day 21', score: 162, projected: 168 },
];

// 本地兜底题目
const MOCK_QUESTIONS = [
  {
    id: 'mock-1',
    type: '单选题',
    question: "[本地演示] 如果 x > 0 且 x² - 4x - 12 = 0，那么 x 的值是多少？",
    options: ["2", "4", "6", "8", "12"],
    correctAnswer: 2, // Index of "6"
    explanation: "解方程 x² - 4x - 12 = 0。因式分解得 (x - 6)(x + 2) = 0。解得 x=6 或 x=-2。因为题目要求 x > 0，所以 x = 6。"
  },
  {
    id: 'mock-2',
    type: '数量比较',
    question: "[本地演示] 比较大小：\nA: 圆的半径为 5 的面积\nB: 正方形边长为 9 的面积",
    options: ["数量 A 更大", "数量 B 更大", "两者相等", "无法从给定信息中确定"],
    correctAnswer: 1, // Index of B
    explanation: "A的面积 = πr² = 25π ≈ 78.5。B的面积 = 9² = 81。因为 81 > 78.5，所以数量 B 更大。"
  }
];

const VIDEO_LESSONS = [
  { id: 1, title: "GRE 数学核心概念：代数基础", duration: "12:30", category: "Algebra" },
  { id: 2, title: "几何难题解析：圆形与多边形", duration: "18:45", category: "Geometry" },
  { id: 3, title: "数据分析：正态分布快速解法", duration: "15:20", category: "Data Analysis" },
];

// --- 工具函数：将后端 MongoDB 数据格式转换为前端 UI 格式 ---
const adaptBackendData = (backendQuestions) => {
  if (!Array.isArray(backendQuestions)) return [];
  
  return backendQuestions.map((q) => {
    // 提取选项文本
    const optionsText = q.options ? q.options.map(opt => opt.text || opt.content || str(opt)) : [];
    
    // 尝试计算正确答案的索引 (后端通常存 'A', 'B' 或 具体值，前端这里简化为索引)
    // 这里的逻辑可能需要根据你实际录入的数据微调
    let correctIdx = -1;
    if (q.correct_answer && q.options) {
        // 假设 correct_answer 是 "A", "B" 或者是选项的具体值
        correctIdx = q.options.findIndex(opt => opt.id === q.correct_answer || opt.text === q.correct_answer);
    }
    // 如果找不到索引，默认选第一个防止报错 (实际开发应处理异常)
    if (correctIdx === -1) correctIdx = 0; 

    return {
      id: q.id, // MongoDB ObjectId string
      type: q.type === 'single_choice' ? '单选题' : '其他',
      question: q.content || q.title, // 优先显示题干
      options: optionsText.length > 0 ? optionsText : ["选项A", "选项B", "选项C", "选项D"],
      correctAnswer: correctIdx,
      explanation: q.analysis || "暂无解析"
    };
  });
};

// --- 2. 组件定义 (本地开发时建议放在 src/components/ 文件夹) ---

// AI 预测图表组件
const AIPredictionChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[130, 170]} />
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <Tooltip 
          contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          itemStyle={{ color: '#1e293b' }}
        />
        <Area type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" name="当前分数" />
        <Line type="monotone" dataKey="projected" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} name="AI 预测趋势" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
      active 
        ? 'bg-blue-600 text-white shadow-md' 
        : 'text-slate-600 hover:bg-slate-100'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const GREModule = () => {
  // 状态管理：题目列表，加载状态，错误信息
  const [questions, setQuestions] = useState(MOCK_QUESTIONS);
  const [loading, setLoading] = useState(false);
  const [useRealData, setUseRealData] = useState(false);

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isExamFinished, setIsExamFinished] = useState(false);

  // 核心：加载题目
  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      console.log(`尝试连接后端: ${API_BASE_URL}/questions`);
      const response = await fetch(`${API_BASE_URL}/questions?limit=10`);
      
      if (!response.ok) {
        throw new Error('网络请求失败');
      }

      const data = await response.json();
      console.log("后端返回数据:", data);

      if (data && data.length > 0) {
        // 数据适配：把后端格式转成前端格式
        const adaptedQuestions = adaptBackendData(data);
        setQuestions(adaptedQuestions);
        setUseRealData(true);
      } else {
        console.warn("后端返回了空数组，使用备用数据");
        setQuestions(MOCK_QUESTIONS);
        setUseRealData(false);
      }
    } catch (error) {
      console.error("连接后端失败，使用本地模拟数据:", error);
      setQuestions(MOCK_QUESTIONS);
      setUseRealData(false);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (selectedOption === questions[currentQIndex].correctAnswer) {
      setScore(score + 1);
    }
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
      setSelectedOption(null);
      setShowResult(false);
    } else {
      setIsExamFinished(true);
    }
  };

  // 渲染加载中
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <RefreshCw className="animate-spin mb-4 text-blue-600" size={32} />
        <p>正在连接题库服务器...</p>
      </div>
    );
  }

  // 渲染完成界面
  if (isExamFinished) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center max-w-2xl mx-auto mt-10">
        <Award size={64} className="mx-auto text-yellow-500 mb-4" />
        <h2 className="text-3xl font-bold text-slate-800 mb-2">练习完成</h2>
        <p className="text-slate-600 mb-6">本次练习得分</p>
        <p className="text-5xl font-bold text-blue-600 mb-8">{score} <span className="text-2xl text-slate-400">/ {questions.length}</span></p>
        <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700">再练一次</button>
      </div>
    );
  }

  const question = questions[currentQIndex];

  return (
    <div className="max-w-3xl mx-auto">
      {/* 提示条：当前使用的是真数据还是假数据 */}
      {!loading && (
        <div className={`text-xs text-center mb-4 p-1 rounded ${useRealData ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {useRealData ? '✅ 已连接真实后端数据库' : '⚠️ 后端连接失败 (或配置了 CORS)，当前显示本地模拟数据'}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <span className="font-bold text-slate-700">Question {currentQIndex + 1} / {questions.length}</span>
          <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">{question.type}</span>
        </div>
        <div className="p-8">
          <h3 className="text-xl font-medium text-slate-800 mb-8 whitespace-pre-line leading-relaxed">{question.question}</h3>
          <div className="space-y-3">
            {question.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => !showResult && setSelectedOption(idx)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  selectedOption === idx ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:bg-slate-50'
                } ${showResult && idx === question.correctAnswer ? 'bg-green-50 border-green-500' : ''}
                  ${showResult && selectedOption === idx && idx !== question.correctAnswer ? 'bg-red-50 border-red-500' : ''}`}
              >
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center mr-3 text-sm ${selectedOption === idx ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-slate-300'}`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  {opt}
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          {!showResult ? (
            <button 
              onClick={() => setShowResult(true)} 
              disabled={selectedOption === null}
              className="ml-auto bg-slate-800 text-white px-6 py-2 rounded-lg hover:bg-slate-900 disabled:opacity-50"
            >
              提交答案
            </button>
          ) : (
            <>
              <div className="text-slate-600 text-sm">
                <span className="font-bold">解析：</span>{question.explanation}
              </div>
              <button onClick={handleNext} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">下一题</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const VideoClassroom = () => {
  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">视频课程</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {VIDEO_LESSONS.map((video) => (
          <div key={video.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group hover:shadow-md transition-shadow cursor-pointer">
            <div className="aspect-video bg-slate-900 relative flex items-center justify-center">
              <PlayCircle size={48} className="text-white opacity-80 group-hover:scale-110 transition-transform" />
              <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">{video.duration}</span>
            </div>
            <div className="p-4">
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">{video.category}</span>
              <h3 className="font-bold text-slate-800 mt-2 line-clamp-2">{video.title}</h3>
            </div>
          </div>
        ))}
        {/* 上传占位符 */}
        <div className="border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-6 text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-colors cursor-pointer bg-slate-50">
          <Upload size={32} className="mb-2" />
          <span className="font-medium">上传新视频</span>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">学习仪表盘</h1>
      
      {/* 核心功能区：AI 分析 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center">
                <Calculator className="mr-2 text-blue-600" size={20}/> 
                AI 成绩预测分析
              </h2>
              <p className="text-slate-500 text-sm">基于你最近 7 天的刷题表现生成的预测模型</p>
            </div>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">目标: 170</span>
          </div>
          
          <div className="h-64 w-full">
             <AIPredictionChart data={AI_MOCK_DATA} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-xl text-white shadow-lg">
            <h3 className="text-blue-100 text-sm font-medium mb-1">预测分数</h3>
            <div className="text-4xl font-bold mb-2">162 <span className="text-lg font-normal opacity-70">/ 170</span></div>
            <p className="text-sm opacity-90">你的几何部分表现出色，建议加强排列组合练习。</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <h3 className="font-bold text-slate-800 mb-4">今日任务</h3>
             <ul className="space-y-3">
               <li className="flex items-center text-sm text-slate-600">
                 <div className="w-2 h-2 rounded-full bg-red-500 mr-3"></div>
                 完成 20 道代数题
               </li>
               <li className="flex items-center text-sm text-slate-600">
                 <div className="w-2 h-2 rounded-full bg-yellow-500 mr-3"></div>
                 观看 "概率论" 视频
               </li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static top-0 left-0 h-full w-64 bg-white border-r border-slate-200 z-30 transition-transform duration-200 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center space-x-2 text-blue-700">
             <div className="bg-blue-600 text-white p-1 rounded"><Calculator size={20} /></div>
             <span className="text-xl font-bold tracking-tight">GRE MathPro</span>
          </div>
          <button className="lg:hidden" onClick={() => setMobileMenuOpen(false)}><X size={20}/></button>
        </div>
        <nav className="p-4 space-y-2">
          <SidebarItem icon={LayoutDashboard} label="仪表盘" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }} />
          <SidebarItem icon={BookOpen} label="GRE 模考" active={activeTab === 'exam'} onClick={() => { setActiveTab('exam'); setMobileMenuOpen(false); }} />
          <SidebarItem icon={PlayCircle} label="视频课程" active={activeTab === 'video'} onClick={() => { setActiveTab('video'); setMobileMenuOpen(false); }} />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center">
          <button onClick={() => setMobileMenuOpen(true)} className="mr-4"><Menu size={24} className="text-slate-600" /></button>
          <span className="font-bold text-slate-700">GRE MathPro</span>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'exam' && <GREModule />}
          {activeTab === 'video' && <VideoClassroom />}
        </div>
      </main>
    </div>
  );
}