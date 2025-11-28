import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  PlayCircle, 
  Award, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Upload, 
  Menu, 
  X,
  LayoutDashboard,
  Calculator,
  Video,
  Loader2,
  AlertTriangle // 新增图标
} from 'lucide-react';

// ============================================================================
// 🛑【核心配置区】请根据你的部署情况修改这里！
// ============================================================================

// 1. 如果你在本地运行 (npm run dev)，请使用: "http://127.0.0.1:8001"
// 2. 如果你部署到了 Vercel，请填入你的 Render 后端地址，例如: "https://gre-backend-xxx.onrender.com"
// ⚠️ 注意：Vercel (https) 无法连接 http 的后端，必须都是 https！

const API_BASE_URL = "https://你的后端项目名.onrender.com"; 

// ============================================================================

// --- 备用演示数据 (当数据库连接失败时显示) ---
const FALLBACK_QUESTIONS = [
  {
    id: "fallback-1",
    type: "single_choice",
    content: "【演示数据】如果 x > 0 且 x² - 4x - 12 = 0，那么 x 的值是多少？\n(你看到这道题说明数据库连接失败了)",
    options: [{id: "A", text: "2"}, {id: "B", text: "6"}, {id: "C", text: "-2"}, {id: "D", text: "0"}],
    correct_answer: "B",
    analysis: "这是一个备用题目。请检查 App.jsx 中的 API_BASE_URL 是否配置正确。"
  }
];

// --- 模拟数据 (用于 Dashboard 和 VideoClassroom) ---

const MOCK_LESSONS = [
  { id: 1, title: "GRE 数学核心概念：代数基础", duration: "12:30", category: "Algebra" },
  { id: 2, title: "几何难题解析：圆形与多边形", duration: "18:45", category: "Geometry" },
  { id: 3, title: "数据分析：正态分布快速解法", duration: "15:20", category: "Data Analysis" },
];

const MOCK_RESOURCES = [
  { title: "算术 (Arithmetic)", desc: "整数、分数、小数、百分比、实数性质" },
  { title: "代数 (Algebra)", desc: "方程、不等式、函数、坐标几何" },
  { title: "几何 (Geometry)", desc: "线、角、三角形、圆、立体几何" },
  { title: "数据分析 (Data Analysis)", desc: "统计、概率、图表解读、排列组合" }
];

// --- 组件定义 ---

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
  const [questions, setQuestions] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false); // 新增：是否在使用备用数据
  const [fetchErrorMsg, setFetchErrorMsg] = useState(""); // 新增：具体的错误信息
  
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isExamFinished, setIsExamFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1200);

  // 1. 获取题目逻辑
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        console.log("正在尝试连接:", `${API_BASE_URL}/questions`);

        const response = await fetch(`${API_BASE_URL}/questions`);
        
        if (!response.ok) {
          throw new Error(`HTTP 错误: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          setQuestions(data);
          setUsingFallback(false);
        } else {
          // 数据库虽然连上了，但是是空的
          console.warn("数据库为空");
          setQuestions(FALLBACK_QUESTIONS);
          setUsingFallback(true);
          setFetchErrorMsg("数据库连接成功，但没有题目。已显示演示数据。");
        }
      } catch (err) {
        console.error("连接失败:", err);
        // 连接失败，使用备用数据，不让页面崩溃
        setQuestions(FALLBACK_QUESTIONS);
        setUsingFallback(true);
        setFetchErrorMsg(`无法连接到后端 (${API_BASE_URL})。可能原因：地址错误、Mixed Content(HTTPS调HTTP)、或后端未启动。`);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []); 

  // 计时器逻辑
  useEffect(() => {
    if (timeLeft > 0 && !isExamFinished && !loading) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, isExamFinished, loading]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleNext = () => {
    const currentQ = questions[currentQIndex];
    const userChoiceId = currentQ.options[selectedOption]?.id; 
    
    if (userChoiceId === currentQ.correct_answer) {
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <Loader2 className="animate-spin mb-4 text-blue-600" size={48} />
        <p>正在尝试连接云端题库...</p>
        <p className="text-xs text-slate-400 mt-2">目标: {API_BASE_URL}</p>
      </div>
    );
  }

  if (isExamFinished) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center max-w-2xl mx-auto mt-10">
        <Award size={64} className="mx-auto text-yellow-500 mb-4" />
        <h2 className="text-3xl font-bold text-slate-800 mb-2">考试完成</h2>
        <div className="flex justify-center items-center space-x-8 mb-8 mt-6">
          <div className="text-center">
            <p className="text-sm text-slate-500 uppercase tracking-wide">答对题数</p>
            <p className="text-4xl font-bold text-green-600">
              {score} <span className="text-lg text-slate-400">/ {questions.length}</span>
            </p>
          </div>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold"
        >
          再练一次
        </button>
      </div>
    );
  }

  const question = questions[currentQIndex];

  return (
    <div className="max-w-4xl mx-auto">
      {/* ⚠️ 连接状态警告条 */}
      {usingFallback && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg flex items-start space-x-3">
          <AlertTriangle className="flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold text-sm">注意：正在显示演示数据</h4>
            <p className="text-xs mt-1">{fetchErrorMsg}</p>
            <p className="text-xs mt-1 font-mono bg-yellow-100 inline-block px-1 rounded">
              请检查代码中的 API_BASE_URL: {API_BASE_URL}
            </p>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm mb-6 border border-slate-200">
        <div className="flex items-center space-x-2 text-slate-700">
          <Calculator size={20} />
          <span className="font-semibold">GRE 真实题库练习</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-orange-600 bg-orange-50 px-3 py-1 rounded-full font-mono">
            <Clock size={16} className="mr-2" />
            {formatTime(timeLeft)}
          </div>
          <div className="text-sm text-slate-500">
            题目 {currentQIndex + 1} / {questions.length}
          </div>
        </div>
      </div>

      {/* Question Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100">
          <div className="flex space-x-2 mb-3">
             <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">
               {question.type === 'single_choice' ? '单选题' : question.type}
             </span>
          </div>
          <h3 className="text-xl font-medium text-slate-800 leading-relaxed whitespace-pre-line">
            {question.content || question.question} 
          </h3>
        </div>

        <div className="p-8 bg-slate-50">
          <div className="space-y-3">
            {question.options && question.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => !showResult && setSelectedOption(idx)}
                disabled={showResult}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  selectedOption === idx
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                } 
                ${showResult && opt.id === question.correct_answer ? 'bg-green-50 border-green-500 ring-1 ring-green-500' : ''}
                ${showResult && selectedOption === idx && opt.id !== question.correct_answer ? 'bg-red-50 border-red-500' : ''}`}
              >
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center mr-4 ${
                    selectedOption === idx ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300'
                  }`}>
                    {opt.id}
                  </div>
                  <span className="text-slate-700">{opt.text || opt}</span>
                </div>
              </button>
            ))}
          </div>

          {showResult && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-slate-700">
              <h4 className="font-bold mb-1 flex items-center">
                <BookOpen size={16} className="mr-2" /> 解析：
              </h4>
              <p>{question.analysis || question.explanation || "暂无解析"}</p>
            </div>
          )}

          <div className="mt-8 flex justify-end">
            {!showResult ? (
              <button
                onClick={() => setShowResult(true)}
                disabled={selectedOption === null}
                className="bg-slate-800 text-white px-6 py-2 rounded-lg hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                提交答案
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                下一题
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const VideoClassroom = () => {
  const [videos, setVideos] = useState(MOCK_LESSONS);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploading(true);
      setTimeout(() => {
        const newVideo = {
          id: videos.length + 1,
          title: file.name.replace(/\.[^/.]+$/, ""),
          duration: "00:15",
          category: "User Upload",
          isLocal: true,
          url: URL.createObjectURL(file)
        };
        setVideos([newVideo, ...videos]);
        setIsUploading(false);
      }, 1500);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">视频讲座库</h2>
          <p className="text-slate-500">观看专业讲师的 GRE 数学解析或上传你自己的讲课内容</p>
        </div>
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="video/*" 
          />
          <button 
            onClick={handleUploadClick}
            disabled={isUploading}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            {isUploading ? (
              <span>上传中...</span>
            ) : (
              <>
                <Upload size={18} />
                <span>上传新视频</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <div key={video.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group hover:shadow-md transition-shadow">
            <div className="aspect-video bg-slate-900 relative flex items-center justify-center overflow-hidden">
               {video.isLocal ? (
                  <video controls className="w-full h-full object-contain">
                    <source src={video.url} type="video/mp4" />
                  </video>
               ) : (
                 <>
                  <PlayCircle size={48} className="text-white opacity-80 group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    {video.duration}
                  </div>
                 </>
               )}
            </div>
            <div className="p-4">
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {video.category}
              </span>
              <h3 className="font-bold text-slate-800 mt-2 line-clamp-2">{video.title}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Dashboard = ({ onNavigate }) => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">欢迎回来, 学生用户!</h1>
        <p className="opacity-90">你距离你的 GRE 目标分数 (170) 还有一段距离，继续加油。</p>
        <button 
          onClick={() => onNavigate('gre')}
          className="mt-6 bg-white text-blue-600 px-6 py-2 rounded-lg font-bold shadow hover:bg-blue-50 transition-colors"
        >
          开始今日练习
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-2 text-slate-800">
            <div className="p-2 bg-green-100 rounded-lg text-green-600">
              <CheckCircle size={24} />
            </div>
            <h3 className="font-bold text-lg">已完成题目</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800 mt-2">124</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-2 text-slate-800">
             <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
              <Video size={24} />
            </div>
            <h3 className="font-bold text-lg">课程进度</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800 mt-2">45%</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-2 text-slate-800">
             <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
              <Award size={24} />
            </div>
            <h3 className="font-bold text-lg">预测分数</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800 mt-2">162</p>
        </div>
      </div>
      
      <div>
         <h2 className="text-xl font-bold text-slate-800 mb-4">学习资料库</h2>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_RESOURCES.map((res, i) => (
               <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer">
                  <h4 className="font-bold text-slate-800 mb-1">{res.title}</h4>
                  <p className="text-sm text-slate-600">{res.desc}</p>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onNavigate={setActiveTab} />;
      case 'gre': return <GREModule />;
      case 'videos': return <VideoClassroom />;
      default: return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed lg:static top-0 left-0 h-full w-64 bg-white border-r border-slate-200 z-30 transform transition-transform duration-200 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-blue-700">
            <div className="bg-blue-600 text-white p-1 rounded">
              <Calculator size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight">GRE MathPro</span>
          </div>
          <button className="lg:hidden" onClick={() => setMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>
        
        <nav className="p-4 space-y-2">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="仪表盘" 
            active={activeTab === 'dashboard'} 
            onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }} 
          />
          <SidebarItem 
            icon={BookOpen} 
            label="GRE 模考" 
            active={activeTab === 'gre'} 
            onClick={() => { setActiveTab('gre'); setMobileMenuOpen(false); }} 
          />
          <SidebarItem 
            icon={PlayCircle} 
            label="视频课堂" 
            active={activeTab === 'videos'} 
            onClick={() => { setActiveTab('videos'); setMobileMenuOpen(false); }} 
          />
        </nav>
        
        <div className="absolute bottom-0 w-full p-4 border-t border-slate-100 bg-slate-50">
           <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                 S
              </div>
              <div>
                 <p className="text-sm font-bold text-slate-700">Student User</p>
                 <p className="text-xs text-slate-500">Premium Member</p>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <button onClick={() => setMobileMenuOpen(true)}>
            <Menu size={24} className="text-slate-600" />
          </button>
          <span className="font-bold text-slate-700">GRE MathPro</span>
          <div className="w-6"></div> {/* Spacer */}
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
