import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import axios from 'axios';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''; // Replace with your key
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export async function GET(request: Request) {
  try {
    // Parse query params
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL must be a string' }, { status: 400 });
    }

    // Extract GitHub owner and repo
    const match = url.match(/https:\/\/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 });
    }

    const owner = match[1];
    const repo = match[2];

    console.log(`Fetching files for ${owner}/${repo}`);

    // Recursive function to fetch repository contents
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
              } catch (error) {
                console.error(`Failed to fetch file: ${item.path}`, error);
              }
            } else if (item.type === 'dir') {
              contents = contents.concat(await fetchFiles(item.path));
            }
          }
        }

        return contents;
      } catch (error) {
        console.error(`Error fetching repository contents:`, error);
        return [];
      }
    };

    // Fetch and concatenate code files
    const codeFiles = await fetchFiles();
    const codeContent = codeFiles.length > 0 ? codeFiles.join('\n\n---\n\n').slice(0, 10000) : 'No code files found';

    console.log(`Code content length: ${codeContent.length} characters`);

    // Gemini AI prompt
    const prompt = `
      Analyze the following code from a GitHub repository and generate structured Markdown documentation. Include:

      📌 Overview
      - Project summary, technologies used, architecture, third-party integrations.

      🏗️ Project Architecture
      - Directory layout, key components, communication flow, deployment.

      🔍 Key Functions & Classes
      - Purpose, parameters, return values, implementation details, usage examples.

      ⚙️ Code Execution Flow
      - Step-by-step explanation, dependencies, request-response cycles.

      🛠️ Installation & Setup
      - Dependencies, environment setup, build/startup instructions.

      🚀 Deployment & Hosting
      - Docker, cloud hosting, CI/CD setup.

      🏗️ Contribution Guidelines
      - Best practices, forking, pull requests, code formatting.

      🔧 Troubleshooting & FAQs
      - Common issues and fixes.

      📚 Additional Notes
      - License, external links.

      Code:
      ${codeContent}
    `;

    console.log('Sending request to Gemini API');

    // Send request to Gemini API
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

    // Validate response from Gemini API
    if (!response.data || !response.data.candidates || !response.data.candidates[0].content.parts[0]) {
      return NextResponse.json({ error: 'Invalid Gemini API response' }, { status: 500 });
    }

    console.log('Received Gemini response');

    const documentation = response.data.candidates[0].content.parts[0].text;

    return NextResponse.json({
      name: `${owner}/${repo}`,
      repocontent: codeContent.length,
      documentation,
    });

  } catch (error: any) {
    console.error('API Error:', error?.response?.data || error?.message || error);

    return NextResponse.json(
      {
        error: error?.message || 'Failed to generate documentation',
        details: error?.response?.data || 'No additional details',
      },
      { status: error?.response?.status || 500 }
    );
  }
}
