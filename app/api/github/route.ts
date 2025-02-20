import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import axios from 'axios';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL must be a string' }, { status: 400 });
    }

    const match = url.match(/https:\/\/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 });
    }

    const owner = match[1];
    const repo = match[2];

    const fetchFiles = async (path = ''): Promise<string[]> => {
      try {
        const { data } = await octokit.repos.getContent({ owner, repo, path });
        let contents: string[] = [];

        if (Array.isArray(data)) {
          for (const item of data) {
            if (item.type === 'file' && /\.(js|ts|py|java|cpp|jsx|md)$/.test(item.name)) {
              try {
                const fileData = await octokit.repos.getContent({ owner, repo, path: item.path });
                if ('content' in fileData.data) {
                  contents.push(Buffer.from(fileData.data.content, 'base64').toString('utf-8'));
                }
              } catch {
                console.error(`Failed to fetch file: ${item.path}`);
              }
            } else if (item.type === 'dir') {
              contents = contents.concat(await fetchFiles(item.path));
            }
          }
        }
        return contents;
      } catch {
        return [];
      }
    };

    const codeFiles = await fetchFiles();
    const codeContent = codeFiles.length > 0 ? codeFiles.join('\n\n---\n\n').slice(0, 10000) : 'No code files found';

    const prompt = `
      Analyze the following code and generate structured Markdown documentation.
      Code:
      ${codeContent}
    `;

    interface GeminiResponse {
      candidates: { content: { parts: { text: string }[] } }[];
    }

    const response = await axios.post<GeminiResponse>(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1500, temperature: 0.7 },
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (!response.data || !response.data.candidates || !response.data.candidates[0].content.parts[0]) {
      return NextResponse.json({ error: 'Invalid Gemini API response' }, { status: 500 });
    }

    const documentation = response.data.candidates[0].content.parts[0].text;

    return NextResponse.json({
      name: `${owner}/${repo}`,
      repocontent: codeContent.length,
      documentation,
    });

  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: error.message || 'Failed to generate documentation',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'An unknown error occurred' },
      { status: 500 }
    );
  }
}
