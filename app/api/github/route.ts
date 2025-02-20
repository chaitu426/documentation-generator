import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import axios from 'axios';
import { stringify } from 'querystring';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN || '' });
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''; // Replace with your key
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL must be a string' }, { status: 400 });
  }

  const match = url.match(/https:\/\/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 });
  }
  let repocontent;
  const [ owner, repo] = match;

  try {
    // Fetch repository contents recursively
    const fetchFiles = async (path: string): Promise<string[]> => {
      const { data } = await octokit.repos.getContent({ owner, repo, path });
      let contents: string[] = [];
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item.type === 'file' && /\.(js|ts|py|java|cpp|jsx|md)$/.test(item.name)) {
            const { data: fileData } = await octokit.repos.getContent({
              owner,
              repo,
              path: item.path,
            });
            if ('content' in fileData) {
              contents.push(Buffer.from((fileData as { content: string }).content, 'base64').toString('utf-8'));
            }
          } else if (item.type === 'dir') {
            contents = contents.concat(await fetchFiles(item.path));
          }
        }
      }
      return contents;
    };

    console.log(`Fetching files for ${owner}/${repo}`);
    const codeFiles = await fetchFiles('');
    const codeContent =
      codeFiles.length > 0
        ? codeFiles.join('\n\n---\n\n').slice(0, 10000)
        : 'No code files found; generate a basic overview based on repository context.';
    console.log(`Code content length: ${codeContent.length} characters`);
    
    repocontent = codeContent.length;

    const prompt = `
     Analyze the following code from a GitHub repository and generate a highly detailed and structured Markdown documentation. Ensure the documentation covers all essential aspects, including but not limited to:

📌 Overview
Provide a high-level summary of the project's purpose, objectives, and functionality.
List the core technologies, frameworks, and libraries used.
Explain the architecture, including backend, frontend, database, and hosting setup.
Describe any third-party integrations (APIs, SDKs, authentication systems, etc.).
🏗️ Project Architecture
Explain the overall structure of the project, including directory layout and key components.
Detail the communication flow between different modules or microservices.
Include diagrams or flowcharts where necessary.
Explain how the project is deployed and hosted (cloud services, CI/CD pipelines, etc.).
🔍 Key Functions & Classes
For each important function or class, provide:

Purpose: What the function or class is responsible for.
Parameters: List of inputs, expected types, and optional/default values.
Return Values: What the function or class returns.
Implementation Details: Key logic and interactions with other parts of the code.
Usage Examples: Real-world examples demonstrating how to use the function/class.
⚙️ Code Execution Flow
Provide a step-by-step explanation of how the code runs, from initialization to execution.
Explain how different modules interact, including dependencies and control flow.
Detail request-response cycles, state management, and data flow.
🛠️ Installation & Setup
Provide clear step-by-step installation instructions.
List required dependencies and how to install them.
Explain how to set up environment variables and configurations.
Provide commands to run the project locally, including build and startup instructions.
🚀 Deployment & Hosting
Explain how to deploy the project (e.g., Docker, AWS, Vercel, Netlify, Firebase, etc.).
Describe CI/CD pipelines and automated workflows if applicable.
Provide instructions for configuring domains, SSL certificates, and performance optimizations.
🏗️ Contribution Guidelines
Outline best practices for contributing to the project.
Explain how to fork, clone, and create pull requests.
List code formatting rules, testing requirements, and review processes.
🔧 Troubleshooting & FAQs
List common issues that developers might encounter and their solutions.
Provide debugging tips, error-handling strategies, and performance optimizations.
Include links to external resources if necessary.
📚 Additional Notes
Mention any license information.
Provide links to related documentation, tutorials, or community forums.
Ensure that the generated Markdown is well-structured, easy to read, and formatted properly with headings, subheadings, code blocks, bullet points, and tables where appropriate.

      Code:
      ${codeContent}
    `;

    console.log('Sending request to Gemini API');
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 1500,
          temperature: 0.7,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Received Gemini response');
    const documentation = (response.data as { candidates: { content: { parts: { text: string }[] } }[] }).candidates[0].content.parts[0].text;

    return NextResponse.json({
      name: `${owner}/${repo}`,
      repocontent: stringify({ length: repocontent }),
      documentation,
    });
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'message' in error) {
      const err = error as { message: string; response?: { status?: number; data?: string } };
  
      console.error('API Error:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
  
      return NextResponse.json(
        {
          error: err.message || 'Failed to generate documentation',
          details: err.response?.data || 'No additional details',
        },
        { status: err.response?.status || 500 }
      );
    }
  
    // If the error doesn't match expected structure, return a generic error
    return NextResponse.json(
      { error: 'Unknown error occurred' },
      { status: 500 }
    );
  
  }
}