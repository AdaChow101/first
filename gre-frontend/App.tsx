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
  Loader2 // 加载图标
} from 'lucide-react';

// ⚠️ 极其重要：请把这里换成你真实的后端地址！
// 如果是本地测试，用 "http://127.0.0.1:8001"
// 如果是上线，用 "https://你的后端项目名.onrender.com"
const API_BASE_URL = "http://127.0.0.1:8001"; 

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
  const [questions, setQuestions] = useState([]); // 存题目的地方
  const [loading, setLoading] = useState(true);   // 加载状态
  const [error, setError] = useState(null);       // 报错状态
  
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isExamFinished, setIsExamFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1200);

  // 1. 新增: 页面加载时，向后端要题目
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        // 发送请求给后端
        const response = await fetch(`${API_BASE_URL}/questions`);
        
        if (!response.ok) {
          throw new Error('无法连接到题库服务器');
        }
        
        const data = await response.json();
        
        // 数据校验: 确保拿到的是个数组且不为空
        if (Array.isArray(data) && data.length > 0) {
          setQuestions(data);
        } else {
          setError("数据库里暂时没有题目，请先去录入几道题吧！");
        }
      } catch (err) {
        console.error("Fetch Error:", err);
        setError("加载题目失败，请检查网络或后端地址。");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []); // 空数组表示只在刚打开时执行一次

  // 计时器逻辑
  useEffect(() => {
    if (timeLeft > 0 && !isExamFinished && !loading && !error) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, isExamFinished, loading, error]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleNext = () => {
    const currentQ = questions[currentQIndex];
    // 假设后端返回的正确答案是选项ID (如 "B")
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

  // --- 渲染加载中状态 ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <Loader2 className="animate-spin mb-4 text-blue-600" size={48} />
        <p>正在从云端题库加载 GRE 难题...</p>
      </div>
    );
  }

  // --- 渲染错误状态 ---
  if (error) {
    return (
      <div className="p-8 bg-red-50 text-red-700 rounded-xl text-center border border-red-200">
        <XCircle size={48} className="mx-auto mb-4" />
        <h3 className="text-lg font-bold">出错了</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-sm underline">
          点击刷新重试
        </button>
      </div>
    );
  }

  // --- 渲染考试结束 ---
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
             <span className="inline-block bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded">
               {question.difficulty || 'Medium'}
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
      // Simulate network request
      setTimeout(() => {
        const newVideo = {
          id: videos.length + 1,
          title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          duration: "00:15", // Mock duration
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
