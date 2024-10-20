// // AgentVoice.js

export const speak = (text) => {
    // 分割文本，按照 <pause> 标记
    const sentences = text.split('<pause>');

    // 获取可用的语音列表
    const voices = window.speechSynthesis.getVoices();

    // 选择第一个女声（如果有多个可用女声，可以自行调整选择逻辑）
    const femaleChineseVoice = voices.find(voice => voice.lang === 'zh-CN' && voice.name.includes('Female'))
        || voices.find(voice => voice.lang === 'zh-CN')
        || voices[0];  // 如果没有找到合适的中文女声，则选用第一个可用语音

    sentences.forEach((sentence, index) => {
        const delay = index === 0 ? 0 : 1500;  // 每个部分之间增加1.5秒的停顿

        setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(sentence.trim());

            // 检测是否包含中文字符
            // const containsChinese = /[\u4e00-\u9fa5]/.test(sentence);
            // if (containsChinese) {

            utterance.voice = femaleChineseVoice; // 设置女声
            utterance.lang = 'zh-CN';  // 如果包含中文，则设置为中文
            // } else {
            //     utterance.lang = 'en-US';  // 否则使用英文
            // }

            speechSynthesis.speak(utterance);
        }, delay * index);
    });
};


// tts
// export const speak = async (text) => {
//     try {
//         // 请求多语言 TTS 合成
//         const response = await fetch('http://localhost:65000/synthesize', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({ text }),
//         });

//         if (!response.ok) {
//             throw new Error('TTS synthesis failed');
//         }

//         const audioBlob = await response.blob();
//         const audioUrl = URL.createObjectURL(audioBlob);

//         // 播放音频
//         const audio = new Audio(audioUrl);
//         audio.play();
//     } catch (error) {
//         console.error('Error:', error);
//     }
// };


