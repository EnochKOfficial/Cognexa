/**
 * TypeScript mirror of the backend's stable `StudyMaterial` contract.
 * See backend/app/schemas.py — keep both in sync.
 */

export interface Position {
  x: number
  y: number
}

export type NodeType = 'topic' | 'subtopic' | 'concept'

export interface MindMapNode {
  id: string
  label: string
  node_type: NodeType
  parent: string | null
  position: Position
}

export interface MindMapEdge {
  id: string
  source: string
  target: string
  label: string | null
}

export interface MainTopic {
  id: string
  label: string
}

export interface Subtopic {
  id: string
  label: string
}

export interface SummarySection {
  title: string
  content: string
}

export interface Summary {
  overview: string
  sections: SummarySection[]
}

export interface KeyTerm {
  term: string
  definition: string
}

export interface Question {
  id: string
  question: string
  type: 'multiple_choice'
  options: string[]
  correct_answer: string
  explanation: string
}

export interface SourceImage {
  upload_id: string
  filename: string
  content_type: string
  size_bytes: number
  width: number
  height: number
  url: string
}

export interface StudyMaterial {
  result_id: string
  is_demo: boolean
  generator: string
  main_topic: MainTopic
  subtopics: Subtopic[]
  nodes: MindMapNode[]
  edges: MindMapEdge[]
  summary: Summary
  key_terms: KeyTerm[]
  questions: Question[]
  source_image: SourceImage
}

export interface UploadResponse {
  upload_id: string
  filename: string
  content_type: string
  size_bytes: number
  width: number
  height: number
  stored_format: string
}

export interface HealthResponse {
  status: string
  service: string
  demo_mode: boolean
  ai_provider: string
  ai_configured: boolean
  reserved_gemma_model: string
  max_upload_mb: number
}

/** Structured error body returned by every backend failure. */
export interface ApiErrorBody {
  error: {
    code: string
    message: string
    detail?: unknown
  }
}
