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
  AlertTriangle,
  ChevronRight,
  List,
  Plus,
  Minus,
  X as CloseIcon
} from 'lucide-react';

// ============================================================================
// 🛑【核心配置区】
// ============================================================================
const API_BASE_URL = "https://ada-math.onrender.com"; 

// --- 备用演示数据 ---
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

// --- 模拟课程数据 (带章节结构) ---
const COURSE_STRUCTURE = [
  {
    chapter: "第1章：代数基础",
    lessons: [
      { id: 101, title: "1.1 整数与实数性质", duration: "12:30", url: "#" },
      { id: 102, title: "1.2 指数与根号运算", duration: "15:45", url: "#" },
      { id: 103, title: "1.3 二次方程快速解法", duration: "10:20", url: "#" }
    ]
  },
  {
    chapter: "第2章：几何突破",
    lessons: [
      { id: 201, title: "2.1 三角形核心定理", duration: "18:10", url: "#" },
      { id: 202, title: "2.2 圆与多边形组合", duration: "20:05", url: "#" },
      { id: 203, title: "2.3 立体几何体积计算", duration: "14:30", url: "#" }
    ]
  },
  {
    chapter: "第3章：数据分析",
    lessons: [
      { id: 301, title: "3.1 正态分布图表", duration: "16:20", url: "#" },
      { id: 302, title: "3.2 排列与组合", duration: "22:15", url: "#" }
    ]
  }
];

const MOCK_RESOURCES = [
  { title: "算术 (Arithmetic)", desc: "整数、分数、小数、百分比、实数性质" },
  { title: "代数 (Algebra)", desc: "方程、不等式、函数、坐标几何" },
  { title: "几何 (Geometry)", desc: "线、角、三角形、圆、立体几何" },
  { title: "数据分析 (Data Analysis)", desc: "统计、概率、图表解读、排列组合" }
];

// ============================================================================
// 📟 GRE 专用计算器组件
// ============================================================================
const GRECalculator = ({ onClose }) => {
  const [display, setDisplay] = useState("0");
  const [memory, setMemory] = useState(0);
  const [expression, setExpression] = useState(""); // 用于记录计算过程 (如 "5 + 3")
  const [resetNext, setResetNext] = useState(false);

  const handleNum = (num) => {
    if (resetNext) {
      setDisplay(num);
      setResetNext(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const handleOp = (op) => {
    setExpression(display + " " + op + " ");
    setResetNext(true);
  };

  const handleEqual = () => {
    try {
      // 替换显示符号 × ÷ 为 * /
      const evalExpr = expression + display;
      const safeExpr = evalExpr.replace(/×/g, "*").replace(/÷/g, "/");
      
      // 安全检查：只允许数字和运算符，防止 XSS 或代码注入
      if (!/^[0-9+\-*/().\s]+$/.test(safeExpr)) {
        throw new Error("Invalid input");
      }

      // 使用 new Function 代替 eval，避免构建工具警告，并稍微提高安全性
      // eslint-disable-next-line no-new-func
      const result = new Function('return ' + safeExpr)();
      
      // GRE 计算器通常显示 8 位左右，处理精度
      const finalRes = String(parseFloat(result.toPrecision(10)));
      
      setDisplay(finalRes);
      setExpression("");
      setResetNext(true);
    } catch (e) {
      setDisplay("Error");
      setResetNext(true);
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setExpression("");
    setResetNext(false);
  };

  const handleSqrt = () => {
    const val = parseFloat(display);
    if (val < 0) {
      setDisplay("Error");
    } else {
      setDisplay(String(Math.sqrt(val)));
    }
    setResetNext(true);
  };

  const handleSign = () => {
    setDisplay(String(parseFloat(display) * -1));
  };

  // 内存操作
  const memAdd = () => { setMemory(memory + parseFloat(display)); setResetNext(true); };
  const memRecall = () => { setDisplay(String(memory)); setResetNext(true); };
  const memClear = () => { setMemory(0); };

  const CalcButton = ({ label, onClick, className = "", highlight = false }) => (
    <button
      onClick={onClick}
      className={`h-10 text-sm font-bold rounded shadow-sm active:translate-y-0.5 transition-transform border border-slate-300 ${
        highlight 
          ? 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700' 
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      } ${className}`}
    >
      {label}
    </button>
  );

  return (
    <div className="absolute top-20 right-4 md:right-10 z-50 w-72 bg-slate-200 rounded-lg shadow-2xl border-2 border-slate-400 overflow-hidden font-mono">
      {/* 顶部栏 */}
      <div className="bg-slate-700 text-white px-3 py-2 flex justify-between items-center cursor-move">
        <span className="text-xs font-bold tracking-wider">GRE CALCULATOR</span>
        <button onClick={onClose} className="hover:text-red-300"><CloseIcon size={16} /></button>
      </div>

      {/* 显示屏 */}
      <div className="p-4 bg-slate-200">
        <div className="bg-white border border-slate-400 p-2 rounded text-right mb-2 h-16 flex flex-col justify-center">
          <div className="text-xs text-slate-400 h-4">{expression}</div>
          <div className="text-2xl font-bold text-slate-800 truncate">{display}</div>
        </div>
        
        {/* 内存指示器 */}
        <div className="flex justify-center mb-2">
           {memory !== 0 && <span className="text-xs font-bold text-slate-600 bg-slate-300 px-2 rounded">M</span>}
        </div>

        {/* 按钮网格 */}
        <div className="grid grid-cols-4 gap-2">
          {/* Row 1: Memory & Clear */}
          <CalcButton label="MR" onClick={memRecall} />
          <CalcButton label="MC" onClick={memClear} />
          <CalcButton label="M+" onClick={memAdd} />
          <CalcButton label="C" onClick={handleClear} className="bg-red-100 text-red-700 border-red-300" />

          {/* Row 2 */}
          <CalcButton label="(" onClick={() => {}} /> 
          <CalcButton label=")" onClick={() => {}} /> 
          <CalcButton label="√" onClick={handleSqrt} />
          <CalcButton label="÷" onClick={() => handleOp("/")} />

          {/* Row 3 */}
          <CalcButton label="7" onClick={() => handleNum("7")} />
          <CalcButton label="8" onClick={() => handleNum("8")} />
          <CalcButton label="9" onClick={() => handleNum("9")} />
          <CalcButton label="×" onClick={() => handleOp("*")} />

          {/* Row 4 */}
          <CalcButton label="4" onClick={() => handleNum("4")} />
          <CalcButton label="5" onClick={() => handleNum("5")} />
          <CalcButton label="6" onClick={() => handleNum("6")} />
          <CalcButton label="-" onClick={() => handleOp("-")} />

          {/* Row 5 */}
          <CalcButton label="1" onClick={() => handleNum("1")} />
          <CalcButton label="2" onClick={() => handleNum("2")} />
          <CalcButton label="3" onClick={() => handleNum("3")} />
          <CalcButton label="+" onClick={() => handleOp("+")} />

          {/* Row 6 */}
          <CalcButton label="±" onClick={handleSign} />
          <CalcButton label="0" onClick={() => handleNum("0")} />
          <CalcButton label="." onClick={() => handleNum(".")} />
          <CalcButton label="=" onClick={handleEqual} highlight />
        </div>
        
        <div className="mt-3 text-center">
          <button className="text-xs text-slate-500 underline">Transfer Display</button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 🧱 基础组件
// ============================================================================

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

// ============================================================================
// 📝 GRE 模考模块 (集成计算器)
// ============================================================================
const GREModule = () => {
  const [questions, setQuestions] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [fetchErrorMsg, setFetchErrorMsg] = useState("");
  const [showCalculator, setShowCalculator] = useState(false); // 控制计算器显示
  
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isExamFinished, setIsExamFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1200);

  // 获取题目逻辑
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/questions`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          setQuestions(data);
          setUsingFallback(false);
        } else {
          setQuestions(FALLBACK_QUESTIONS);
          setUsingFallback(true);
          setFetchErrorMsg("数据库为空，显示演示数据。");
        }
      } catch (err) {
        setQuestions(FALLBACK_QUESTIONS);
        setUsingFallback(true);
        setFetchErrorMsg("无法连接到后端，显示演示数据。");
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
        <p>正在加载试卷...</p>
      </div>
    );
  }

  if (isExamFinished) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center max-w-2xl mx-auto mt-10">
        <Award size={64} className="mx-auto text-yellow-500 mb-4" />
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Section Complete</h2>
        <p className="text-4xl font-bold text-green-600 my-6">
          {score} <span className="text-lg text-slate-400">/ {questions.length} Correct</span>
        </p>
        <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700">Return to Home</button>
      </div>
    );
  }

  const question = questions[currentQIndex];

  return (
    <div className="relative max-w-5xl mx-auto">
      {/* 计算器弹窗 */}
      {showCalculator && <GRECalculator onClose={() => setShowCalculator(false)} />}

      {/* 错误提示条 */}
      {usingFallback && (
        <div className="mb-4 bg-yellow-50 text-yellow-800 p-2 text-xs rounded flex items-center">
          <AlertTriangle size={14} className="mr-2" /> 演示模式: {fetchErrorMsg}
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-wrap justify-between items-center bg-slate-800 text-slate-100 p-3 rounded-t-lg shadow-sm">
        <div className="flex items-center space-x-4">
          <span className="font-bold tracking-wide">GRE Quantitative Section 1</span>
          <div className="bg-slate-700 px-3 py-1 rounded text-sm font-mono flex items-center">
             <Clock size={14} className="mr-2 text-orange-400" />
             {formatTime(timeLeft)}
          </div>
        </div>
        
        <div className="flex items-center space-x-4 mt-2 md:mt-0">
          <button 
            onClick={() => setShowCalculator(!showCalculator)}
            className={`flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ${
              showCalculator ? 'bg-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
          >
            <Calculator size={16} />
            <span>Calculator</span>
          </button>
          <div className="text-sm text-slate-400">
            {currentQIndex + 1} of {questions.length}
          </div>
        </div>
      </div>

      {/* Question Area */}
      <div className="bg-white border-x border-b border-slate-200 min-h-[500px] flex flex-col">
        <div className="flex-1 p-8 flex flex-col md:flex-row gap-8">
            {/* 左侧：题目内容 */}
            <div className="flex-1">
                <div className="text-lg font-medium text-slate-900 leading-8 whitespace-pre-wrap font-serif">
                    {question.content || question.question}
                </div>
            </div>

            {/* 右侧：选项区 (模仿真实考试布局) */}
            <div className="w-full md:w-1/3 bg-slate-50 p-6 border-l border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-wider">Select One Answer</p>
                <div className="space-y-3">
                    {question.options && question.options.map((opt, idx) => (
                    <label 
                        key={idx} 
                        className={`flex items-center p-3 rounded cursor-pointer border hover:bg-blue-50 transition-all ${
                            selectedOption === idx ? 'bg-blue-100 border-blue-400' : 'bg-white border-slate-300'
                        }`}
                    >
                        <input 
                            type="radio" 
                            name="option"
                            className="w-5 h-5 text-blue-600"
                            checked={selectedOption === idx}
                            onChange={() => !showResult && setSelectedOption(idx)}
                            disabled={showResult}
                        />
                        <span className="ml-3 text-slate-800 font-medium">{opt.text || opt}</span>
                        {/* 结果显示 */}
                        {showResult && opt.id === question.correct_answer && <CheckCircle size={16} className="ml-auto text-green-600" />}
                        {showResult && selectedOption === idx && opt.id !== question.correct_answer && <XCircle size={16} className="ml-auto text-red-500" />}
                    </label>
                    ))}
                </div>
            </div>
        </div>

        {/* 底部导航栏 */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex justify-between items-center">
            <div className="text-xs text-slate-500">
                {showResult && <span className="font-bold text-blue-700">解析: {question.analysis || "无解析"}</span>}
            </div>
            
            <div className="flex space-x-3">
                {!showResult ? (
                    <button 
                        onClick={() => setShowResult(true)} 
                        disabled={selectedOption === null}
                        className="bg-slate-800 text-white px-6 py-2 rounded shadow hover:bg-slate-900 disabled:opacity-50"
                    >
                        Confirm Answer
                    </button>
                ) : (
                    <button 
                        onClick={handleNext} 
                        className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 flex items-center"
                    >
                        Next <ChevronRight size={16} className="ml-1" />
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 📺 升级版视频课程模块 (带目录)
// ============================================================================
const VideoCourseModule = () => {
  const [activeVideo, setActiveVideo] = useState(COURSE_STRUCTURE[0].lessons[0]);
  const [collapsedChapters, setCollapsedChapters] = useState({});

  const toggleChapter = (idx) => {
    setCollapsedChapters(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-slate-800">GRE 数学精讲课程</h2>
        <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">已购课程</span>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
        {/* 左侧：播放器区域 */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-black aspect-video flex items-center justify-center relative">
                <PlayCircle size={64} className="text-white opacity-80" />
                <p className="absolute bottom-4 text-white text-sm opacity-70">模拟播放器: {activeVideo.title}</p>
            </div>
            <div className="p-6 flex-1 overflow-auto">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">{activeVideo.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-slate-500 mb-6">
                    <span className="flex items-center"><Clock size={14} className="mr-1" /> {activeVideo.duration}</span>
                    <span className="flex items-center"><Award size={14} className="mr-1" /> 核心考点</span>
                </div>
                <hr className="mb-6"/>
                <h3 className="font-bold mb-2">本节重点：</h3>
                <ul className="list-disc list-inside text-slate-600 space-y-1">
                    <li>理解 {activeVideo.title.split(' ')[1]} 的基本定义</li>
                    <li>掌握常见 GRE 陷阱题型</li>
                    <li>配套练习题解析</li>
                </ul>
            </div>
        </div>

        {/* 右侧：课程目录 (Sidebar) */}
        <div className="w-full lg:w-80 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-700 flex items-center">
                    <List size={18} className="mr-2"/> 课程大纲
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {COURSE_STRUCTURE.map((chapter, cIdx) => (
                    <div key={cIdx} className="border border-slate-100 rounded-lg overflow-hidden">
                        <button 
                            onClick={() => toggleChapter(cIdx)}
                            className="w-full flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100 text-left font-bold text-slate-700 text-sm"
                        >
                            <span>{chapter.chapter}</span>
                            {collapsedChapters[cIdx] ? <Plus size={14}/> : <Minus size={14}/>}
                        </button>
                        
                        {!collapsedChapters[cIdx] && (
                            <div className="bg-white">
                                {chapter.lessons.map((lesson) => (
                                    <button
                                        key={lesson.id}
                                        onClick={() => setActiveVideo(lesson)}
                                        className={`w-full text-left p-3 text-sm flex items-center justify-between border-l-4 transition-colors ${
                                            activeVideo.id === lesson.id 
                                                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                                : 'border-transparent text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-center">
                                            {activeVideo.id === lesson.id ? <PlayCircle size={14} className="mr-2"/> : <div className="w-3.5 mr-2" />}
                                            <span className="truncate w-40">{lesson.title.split(' ')[1]}</span>
                                        </div>
                                        <span className="text-xs text-slate-400">{lesson.duration}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 📊 Dashboard (仪表盘)
// ============================================================================
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
            <div className="p-2 bg-green-100 rounded-lg text-green-600"><CheckCircle size={24} /></div>
            <h3 className="font-bold text-lg">已完成题目</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800 mt-2">124</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-2 text-slate-800">
             <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Video size={24} /></div>
            <h3 className="font-bold text-lg">课程进度</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800 mt-2">45%</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-2 text-slate-800">
             <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><Award size={24} /></div>
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

// ============================================================================
// 📱 App 主入口
// ============================================================================
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onNavigate={setActiveTab} />;
      case 'gre': return <GREModule />;
      case 'videos': return <VideoCourseModule />; // 使用新的课程模块
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
            <div className="bg-blue-600 text-white p-1 rounded"><Calculator size={20} /></div>
            <span className="text-xl font-bold tracking-tight">GRE MathPro</span>
          </div>
          <button className="lg:hidden" onClick={() => setMobileMenuOpen(false)}><X size={20} /></button>
        </div>
        
        <nav className="p-4 space-y-2">
          <SidebarItem 
            icon={LayoutDashboard} label="仪表盘" 
            active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }} 
          />
          <SidebarItem 
            icon={BookOpen} label="GRE 模考" 
            active={activeTab === 'gre'} onClick={() => { setActiveTab('gre'); setMobileMenuOpen(false); }} 
          />
          <SidebarItem 
            icon={PlayCircle} label="视频课程" 
            active={activeTab === 'videos'} onClick={() => { setActiveTab('videos'); setMobileMenuOpen(false); }} 
          />
        </nav>
        
        <div className="absolute bottom-0 w-full p-4 border-t border-slate-100 bg-slate-50">
           <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">S</div>
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
          <button onClick={() => setMobileMenuOpen(true)}><Menu size={24} className="text-slate-600" /></button>
          <span className="font-bold text-slate-700">GRE MathPro</span>
          <div className="w-6"></div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
