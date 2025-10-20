# **App Name**: Cognitive Luminescence Mindmapper

## Core Features:

- AI-Powered Mind Map Generation: Generates mind maps from text, files, or voice input, identifying definitions, warnings, formulas, and concepts using AI.
- Dynamic Node Physics and Trails: Implements draggable nodes with physics-based interactions and visual trails of recent node views.
- Adaptive Summarization Panel: Displays context-aware summaries (TL;DR, detailed, analogy) for selected nodes with optional text-to-speech.
- One-Day Mode Optimization: Filters mind maps to the most important concepts when time is short, collapsing supporting details. This mode uses an AI tool that ranks concept importance.
- Multi-Format Export: Enables exporting mind maps to PNG, PDF, JSON, CSV, and Google Sheets formats.
- Voice Command Interface: Accepts voice commands to perform actions like explaining a concept or saving notes using speech-to-text and AI.
- Adaptive Learning & Feedback: Tracks user interactions and generates flashcards for weak points to reinforce learning.

## Style Guidelines:

- Primary background color: Deep Space Gray (#0C0C10) for a dark, focused environment.
- Secondary panel color: Charcoal Blue (#171A21) to differentiate panels with subtle contrast.
- Accent color: Soft Amber Orange (#FF8A3D) to highlight interactive elements and important information.
- Headline font: 'Clash Display', a geometric sans-serif for a modern feel. Note: currently only Google Fonts are supported.
- Body/UI font: 'Inter Tight', a sans-serif for clean readability. Note: currently only Google Fonts are supported.
- Numbers/Code font: 'IBM Plex Mono', a monospace font for clear code display. Note: currently only Google Fonts are supported.
- Use a set of minimalist, glowing icons that reflect the cognitive luminescence theme. Ensure icons are easily distinguishable and accessible.
- Implement a glass-layer refraction effect for panels using backdrop-filter: blur(20px) saturate(140%) contrast(110%). This creates a sense of depth and focus.
- Use microanimations with a spring config (stiffness: 300, damping: 25, mass: 0.8) for smooth, engaging interactions.