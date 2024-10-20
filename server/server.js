const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { OpenAI } = require('openai');
const cnchar = require('cnchar');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('cnchar-order'); // 笔画顺序插件
require('dotenv').config();

// 创建 OpenAI API 客户端
const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY || process.env.OPENAI_API_KEY,  // 从 .env 文件中读取 API 密钥
});

// 定义要随机选择的字符列表
const characterList = ['你', '好', '学', '习', '的', '我', '是', '人', '大', '小'];

const app = express();
app.use(bodyParser.json());
app.use(cors({
    origin: 'http://localhost:3000'  // Allow requests from your frontend
}));


const cache = new Map(); // 使用 Map 来缓存生成的音频


app.post('/synthesize', (req, res) => {
    const { text } = req.body;

    // 检查缓存中是否有该文本的生成结果
    if (cache.has(text)) {
        const cachedFilePath = cache.get(text);
        return res.sendFile(cachedFilePath);
    }

    // const command = `tts --text "${text}" --model_name "tts_models/en/ljspeech/glow-tts" --out_path output.wav`;
    const command = `tts --text "Hello world" --model_name "tts_models/multilingual/multi-dataset/xtts_v2" --out_path output.wav`;
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.status(500).send('Failed to synthesize audio.');
        }

        const filePath = path.resolve(__dirname, 'output.wav');
        cache.set(text, filePath); // 缓存生成的文件

        res.sendFile(filePath, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(500).send('Failed to send audio.');
            }

            // 删除音频文件可视需求，也可以选择保留一段时间
            fs.unlink(filePath, (err) => {
                if (err) console.error('Error deleting file:', err);
            });
        });
    });
});



function cleanMessageContent(content) {
    // 将阿拉伯数字转换为英文单词，并在每个笔顺前添加 <pause>
    const numberMap = {
        '1': 'First',
        '2': 'Second',
        '3': 'Third',
        '4': 'Fourth',
        '5': 'Fifth',
        '6': 'Sixth',
        '7': 'Seventh',
        '8': 'Eighth',
        '9': 'Ninth',
        '10': 'Tenth',
        '11': 'Eleventh',
        '12': 'Twelfth',
        '13': 'Thirteenth',
        '14': 'Fourteenth',
        '15': 'Fifteenth',
        '16': 'Sixteenth',
    };

    // 替换阿拉伯数字为英文单词，并在前面加上 `<pause>` 表示停顿
    let cleanedContent = content.replace(/\b(\d+)\b/g, (match) => `<pause> ${numberMap[match] || match}`);

    // 在每个中文字符后面加上 `<pause>`，确保每个字符后面有停顿
    cleanedContent = cleanedContent.replace(/([\u4e00-\u9fa5])/g, (match) => `${match} <pause>`);

    // 清理中文和拼音中的特殊符号，确保中文字符和拼音对齐
    cleanedContent = cleanedContent.replace(/\*/g, '');  // 移除加粗符号
    cleanedContent = cleanedContent.replace(/(\r\n|\n|\r)/g, ' ');  // 移除换行符，保持文本连贯
    cleanedContent = cleanedContent.replace(/[\[\]()]/g, '');  // 移除不需要的括号
    cleanedContent = cleanedContent.replace(/\s+/g, ' ').trim();  // 移除多余空格

    return cleanedContent;
}

async function generateOptimizedExplanation(character, formattedStrokes) {

    // 拼接所有字符的笔画信息
    const formattedStrokesText = character.split('').map((char, charIndex) => {
        const strokesForChar = formattedStrokes[charIndex]; // 获取当前字符的笔画
        const strokeDescriptions = strokesForChar.join(', '); // 将笔画列表拼接成字符串
        return `${char}: ${strokeDescriptions}`; // 返回字符和对应的笔画描述
    }).join('; '); // 使用中文分号拼接多个字符

    console.log('Formatted strokes for all characters:', formattedStrokesText);

    // 调用 OpenAI API 生成解释
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',  // 使用 gpt-4-mini 模型
            messages: [
                {
                    role: 'system',
                    content: `
                        You are a Chinese language teacher speak to your children in English. Explain the stroke order of multiple Chinese characters using this format:
                        Briefly explain the meaning and structure of each character in no more than 30 words.
                        For each character, list the strokes, each described in no more than 10 words.
                        Ensure that the explanation is accurate, concise, and delivered in a calm, instructional tone.
                        Avoid using titles like "Meaning and Structure" or "Strokes" in your response.`,
                },
                {
                    role: 'user',
                    content: `Explain the stroke order of these characters: \n${formattedStrokesText}`,
                },
            ],
        });

        // console.log('OpenAI response:', JSON.stringify(response, null, 2));

        if (!response || !response.choices) {
            throw new Error('Invalid response from OpenAI');
        }

        // 检查 message 对象的具体内容
        let messageContent = response.choices[0]?.message?.content;
        if (!messageContent) {
            throw new Error('OpenAI response message is undefined');
        }

        // 清理内容，去除格式符号和转换数字
        messageContent = cleanMessageContent(messageContent);
        console.log('Content to speak:', messageContent);

        return messageContent; // 返回清理后的解释内容
    } catch (error) {
        console.error('Error calling OpenAI:', error);
        throw new Error('Failed to generate explanation from OpenAI');
    }
}

// 生成笔顺解释的 API
app.post('/generate-explanation', async (req, res) => {
    try {
        console.log('Received request:', req.body);
        const { characters, formattedStrokes } = req.body;

        if (!characters || !formattedStrokes) {
            return res.status(400).json({ error: 'Characters and formattedStrokes are required' });
        }

        const explanation = await generateOptimizedExplanation(characters, formattedStrokes);
        res.json({ explanation });
    } catch (error) {
        console.error('Error generating explanation:', error.message);
        res.status(500).json({ error: 'Failed to generate explanation' });
    }
});

// 新增 endpoint: 获取随机字符
app.get('/generate-random-character', (req, res) => {
    const randomCharacter = characterList[Math.floor(Math.random() * characterList.length)];
    res.json({ character: randomCharacter });
});


const PORT = process.env.PORT || 65000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
