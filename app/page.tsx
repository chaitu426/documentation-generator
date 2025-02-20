"use client"

import { useState } from "react"
import { Bot, Github, Loader2, Code2, BookOpen, Blocks, Sparkles, ArrowRight } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

const features = [
  {
    icon: <Code2 className="size-6" />,
    title: "Code Analysis",
    description: "Deep analysis of repository structure, dependencies, and code patterns",
  },
  {
    icon: <BookOpen className="size-6" />,
    title: "Documentation",
    description: "Comprehensive documentation generation with clear explanations",
  },
  {
    icon: <Blocks className="size-6" />,
    title: "Architecture",
    description: "Understand system architecture and component relationships",
  },
  {
    icon: <Sparkles className="size-6" />,
    title: "AI-Powered",
    description: "Leveraging Gemini AI for intelligent code understanding",
  },
]

export default function Home() {
  const [url, setUrl] = useState("")
  const [repoData, setRepoData] = useState<{ name: string; documentation: string } | null>(null)
  const [error, setError] = useState("")
  const [isLoading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [repocontent, setRepoContent] = useState("")

  const loadingSteps = [
    "Analyzing repository structure...",
    "Reading code files and documentation...",
    "Processing with Gemini AI...",
    "Generating comprehensive documentation...",
    "Formatting results...",
  ]

  const updateLoadingStep = () => {
    setLoadingStep((prev) => (prev + 1) % loadingSteps.length)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setRepoData(null)
    setLoadingStep(0)

    const loadingInterval = setInterval(updateLoadingStep, 2000)

    try {
      const response = await fetch(`/api/github?url=${encodeURIComponent(url)}`, {
        method: "GET",
      })
      const data = await response.json()
      if (response.ok) {
        setRepoData(data)
        setRepoContent(data.repocontent)
      } else {
        setError(data.error + (data.details ? `: ${JSON.stringify(data.details)}` : ""))
      }
    } catch (err) {
      setError("An error occurred while fetching data.")
    } finally {
      setLoading(false)
      clearInterval(loadingInterval)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 space-y-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 max-w-3xl mx-auto"
        >
          <div className="inline-block p-2 bg-primary/5 rounded-full mb-4">
            <Bot className="size-12 text-primary" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight">
            AI-Powered Documentation Generator
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your GitHub repositories into comprehensive, well-structured documentation using the power of Gemini AI
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-3xl mx-auto w-full"
        >
          <Card className="border-2 border-primary/10">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="flex gap-3">
                <div className="relative flex-1">
                  <Github className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                  <Input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste your GitHub repository URL"
                    className="pl-11 h-12 text-base"
                  />
                </div>
                <Button type="submit" disabled={isLoading} size="lg" className="h-9 px-6 w-28">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Analyzing
                    </>
                  ) : (
                    <>
                      Generate
                      <ArrowRight className="ml-2 size-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Features Grid */}
        {!repoData && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature, index) => (
              <Card key={index} className="border-none bg-primary/5 hover:bg-primary/10 transition-colors">
                <CardHeader>
                  <div className="size-12 rounded-lg bg-background flex items-center justify-center mb-2">
                    {feature.icon}
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </motion.div>
        )}

        {/* Results Section */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 text-red-500 bg-red-50 dark:bg-red-950/50 rounded-lg text-center max-w-3xl mx-auto"
              >
                {error}
              </motion.div>
            )}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 max-w-3xl mx-auto"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    <p className="text-muted-foreground">{loadingSteps[loadingStep]}</p>
                  </div>
                  <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: "0%" }}
                      animate={{
                        width: `${((loadingStep + 1) / loadingSteps.length) * 100}%`,
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                <Card className="overflow-hidden border-none shadow-lg">
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="space-y-3 mt-6">
                      <Skeleton className="h-6 w-1/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4/5" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {repoData && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4 max-w-4xl mx-auto"
              >
                <Card className="overflow-hidden border-none shadow-lg">
                  <CardContent className="p-8">
                    <div className="flex items-center gap-3 mb-8 pb-6 border-b">
                      <div className="p-2 bg-primary/5 rounded-lg">
                        <Github className="size-6" />
                      </div>
                      <div className="flex-col">
                      <h2 className="text-2xl font-semibold">{repoData.name}</h2>
                      <p className="text-sm font-normal">The data extracted from repo has {repocontent} characters</p>
                      </div>
                    </div>
                    <div className="prose prose-stone dark:prose-invert max-w-none">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => <h1 className="text-2xl font-bold mt-8 mb-4">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-xl font-bold mt-6 mb-3">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-lg font-bold mt-4 mb-2">{children}</h3>,
                          p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
                          li: ({ children }) => <li>{children}</li>,
                          code: ({ children }) => (
                            <code className="bg-muted px-1.5 py-0.5 rounded-md text-sm font-mono">{children}</code>
                          ),
                          pre: ({ children }) => (
                            <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4 text-sm">{children}</pre>
                          ),
                        }}
                      >
                        {repoData.documentation}
                      </ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}