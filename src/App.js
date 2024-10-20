// src/App.js
import React, { useState, useRef, useEffect } from 'react';
import DialogueBox from './components/DialogueBox';
import WritingCanvas from './components/WritingCanvas';
import TextInput from './components/TextInput';
import { speak } from './components/AgentVoice';
import cnchar from 'cnchar';  // 核心库
import order from 'cnchar-order';  // 笔顺插件
import 'cnchar-order';  // 笔顺插件
import 'cnchar-draw';   // 动画插件
cnchar.use(order);

const learnedCharacters = [];

const App = () => {
  const [dialogue, setDialogue] = useState([]);
  const [currentCharacter, setCurrentCharacter] = useState('');
  const [animationWriter, setAnimationWriter] = useState(null);  // 用于控制动画
  const animationRef = useRef(); // 记录动画状态
  const testCanvasRef = useRef(); // 记录test canvas

  // 获取随机字符
  const fetchRandomCharacter = async () => {
    try {
      const response = await fetch('http://localhost:65000/generate-random-character');
      const data = await response.json();
      setCurrentCharacter(data.character);
    } catch (error) {
      console.error('Error fetching random character:', error);
    }
  };

  const getStrokeDetails = (character) => {
    const strokeDetails = cnchar.stroke(character, 'order', 'name');
    return strokeDetails;
  };

  // 调用后端 API 生成笔顺讲解
  const generateStrokeExplanation = async (char) => {
    const strokeDetails = getStrokeDetails(char);

    // 格式化笔画信息
    const formattedStrokes = strokeDetails
      .map((stroke, index) => `Stroke ${index + 1}: ${stroke}`)
      .join('\n');

    try {
      const response = await fetch('http://localhost:65000/generate-explanation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          characters: char,
          formattedStrokes: strokeDetails,
        }),
      });

      const data = await response.json();
      const explanation = data.explanation;
      speak(explanation);  // 调用 AI 生成的解释并确保数字为英文
    } catch (error) {
      console.error('Error fetching explanation:', error);
      speak('Sorry, there was an issue generating the explanation.');
    }
  };

  // 开始学习并更新引导语句
  const handleStartLearning = async () => {
    // 确保已经有一个字符（从后端获取）
    if (!currentCharacter) {
      await fetchRandomCharacter();  // 确保从后端获取字符
    }

    if (currentCharacter) {
      const newDialogue = [
        ...dialogue,
        { speaker: 'ai', text: `Let's learn how to write the character "${currentCharacter}".` }
      ];
      setDialogue(newDialogue);
      speak(newDialogue[newDialogue.length - 1].text);

      drawCharacterStrokeOrderWithTest(currentCharacter);
    }
  };

  // 初始化获取随机字符
  useEffect(() => {
    fetchRandomCharacter();

    // 页面刷新或关闭时，停止所有的语音
    const stopVoiceOnUnload = () => {
      speechSynthesis.cancel();  // 停止所有的语音播放
    };

    // 监听页面卸载事件
    window.addEventListener('beforeunload', stopVoiceOnUnload);

    // 清除事件监听
    return () => {
      window.removeEventListener('beforeunload', stopVoiceOnUnload);
      speechSynthesis.cancel();  // 组件卸载时停止语音
    };
  }, []);

  const handleAIQuestion = (char) => {
    // 清空 animation 和 test canvas
    clearCanvas('animation-canvas');
    clearCanvas('test-canvas');

    const chineseCharRegex = /^[\u4e00-\u9fff]+$/;  // 检查是否为中文字符
    if (chineseCharRegex.test(char)) {
      if (learnedCharacters.includes(char)) {
        speak(`You have already learned the character ${char}.`);
        askForNextAction();
      } else {
        setCurrentCharacter(char);
        // 增加语音引导，告诉用户要学习这个字
        speak(`Let's learn how to write the character "${char}".`);

        // 开始绘制该字符并进入测试模式
        drawCharacterStrokeOrderWithTest(char);
      }
    } else {
      speak('Please enter a valid Chinese character.');
    }
  };

  const handleStopSpeaking = () => {
    speechSynthesis.cancel();  // 停止当前所有的语音播放
  };

  // 渲染新的测试区域
  const drawCharacterStrokeOrderWithTest = (char) => {
    clearCanvas('test-canvas'); // 清空之前的 canvas 内容
    console.log('Drawing character for test:', char); // 添加日志查看字符
    const strokeCount = cnchar.stroke(char);
    console.log('Total strokes for character:', strokeCount);
    const strokeDetails = cnchar.stroke(char, 'order', 'shape');
    console.log('xxx', strokeDetails); // 输出：[["横"],["撇", "捺", "竖"]]

    let currentStroke = 0;

    // 使用test模式检测笔顺
    const testWriter = cnchar.draw(char, {
      el: '#test-canvas',  // 使用书写的 canvas
      type: cnchar.draw.TYPE.TEST,  // 设置为测试模式
      clear: true,  // 确保在绘制之前清空容器
      style: {
        backgroundColor: '#fff',
        strokeColor: '#000',
        outlineColor: '#ccc',
        padding: 20,  // 调整 padding 让字符更居中
        length: 170,  // 调整这个数值放大字符 (默认是60)
        strokeFadeDuration: 400,  // 每个笔画完成后的渐变时间
      },
      line: {
        lineStraight: true,
        lineCross: true,
        lineColor: '#ddd',
        border: true,
        borderWidth: 1,
        borderColor: '#ccc',
      },
      test: {
        strokeHighlightSpeed: 300,
        highlightColor: '#aaf',
        drawingColor: '#333',
        drawingWidth: 4,
        showHintAfterMisses: 1,  // 允许用户错三次后才显示提示
        highlightOnComplete: true,  // 在完成书写后高亮显示整个字符
        onTestStatus: ({ index, status }) => {
          console.log(`Stroke ${index} status:`, status);
          if (status === 'mistake') {
            speak('Try again.');  // 错误提示

          } else if (status === 'correct') {
            currentStroke++;  // 每次正确书写时递增 currentStroke
            console.log(`Stroke ${currentStroke} is correct.`);

            if (currentStroke === strokeCount) {
              speak('Good job! You wrote the character correctly.');
              askForNextAction();  // 询问用户是否继续学习或重新练习
            }
          }
        },
        onComplete: () => {
          console.log('Character written correctly!');
          speak('Congratulations! You wrote the character correctly.');
          askForNextAction();  // 询问用户是否继续学习或重新练习
        },
      },
    });

    // 保存当前的 test writer 以便于重置等操作
    testCanvasRef.current = testWriter;
  };

  // 重置按钮逻辑
  const resetTestCanvas = async () => {
    if (testCanvasRef.current && currentCharacter) {
      // 重新渲染测试字符，模拟 reset
      drawCharacterStrokeOrderWithTest(currentCharacter);  // 使用当前字符重新绘制
      console.log('Resetting test canvas for character:', currentCharacter);
      speak('The canvas has been reset. Try again!');
    } else {
      await handleStartLearning();
    }
  };

  // 清空 canvas 内容的函数
  const clearCanvas = (canvasId) => {
    const canvas = document.getElementById(canvasId);
    if (canvas) {
      canvas.innerHTML = ''; // 清空 canvas 的内容
    }
  };


  const handlePauseAnimation = () => {
    if (animationRef.current) {
      animationRef.current.pauseAnimation();
    }
  };

  const handleResumeAnimation = () => {
    if (animationRef.current) {
      animationRef.current.resumeAnimation();
    }
  };

  const askForNextAction = () => {
    const newDialogue = [
      ...dialogue,
      { speaker: 'ai', text: 'Would you like to practice this character again or learn a new one?' }
    ];
    setDialogue(newDialogue);
    speak(newDialogue[newDialogue.length - 1].text);
  };




  // 笔顺动画与AI讲解
  const showStrokeAnimationWithAI = (char) => {
    if (!char) {
      console.error('No character provided for animation.');
      return;
    }
    console.log('Animating character:', char); // 检查输出的字符

    // 清空 animation canvas
    clearCanvas('animation-canvas');

    const writer = cnchar.draw(char, {
      el: '#animation-canvas',
      type: cnchar.draw.TYPE.ANIMATION,
      style: {
        backgroundColor: '#fff',
        strokeColor: '#000',
        outlineColor: '#ccc',
      },
      animation: {
        strokeAnimationSpeed: 0.5, // 速度慢一点
        delayBetweenStrokes: 1500, // 每笔之间增加间隔时间 1.5秒
        autoAnimate: true,
        loopAnimate: true,
      },
    });

    setAnimationWriter(writer);
    animationRef.current = writer;
    generateStrokeExplanation(currentCharacter);  // 调用生成笔顺讲解

  };



  return (
    <div>
      {/* <DialogueBox dialogue={dialogue} /> */}

      {/* 动画显示的区域 */}
      <div id="animation-container" style={{ height: '200px', width: '300px', marginBottom: '20px' }}>
        <button onClick={handlePauseAnimation}>Pause Animation</button>
        <button onClick={handleResumeAnimation} style={{ marginLeft: '10px' }}>Resume Animation</button>
        <div id="animation-canvas"></div> {/* 动画 canvas */}
      </div>

      {/* 书写区域 - 放大了测试模式的书写区域 */}
      <div id="test-canvas-container" style={{ height: '400px', marginBottom: '80px', position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
        <div id="test-canvas" style={{ height: '300px', transform: 'scale(2) translateY(100px)' }}></div> {/* 测试模式的 canvas */}

      </div>

      {/* 将按钮放在书写区域下方，确保不被遮挡 */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <button onClick={resetTestCanvas}>Reset</button> {/* 重置按钮 */}
        <button onClick={handleStartLearning}>Start Learning</button>
        <button onClick={() => showStrokeAnimationWithAI(currentCharacter)} style={{ marginLeft: '10px' }}>Show Animation and Explain</button>
        <button onClick={handleStopSpeaking}>Stop Speaking</button>

      </div>

      <TextInput onSend={handleAIQuestion} />
    </div>
  );
};

export default App;
