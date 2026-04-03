# Image Generator

A full-stack AI-powered image generation application with RAG (Retrieval-Augmented Generation) capabilities. The application intelligently enhances user prompts using a knowledge base before generating high-quality images.



!\[Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square\&logo=next.js)

!\[TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square\&logo=typescript)

!\[Tailwind CSS](https://img.shields.io/badge/Tailwind\_CSS-4-38B2AC?style=flat-square\&logo=tailwind-css)

!\[Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square\&logo=prisma)

## 

## ✨ Features

### Core Features

* **AI Image Generation** - Create stunning images from text prompts using state-of-the-art AI models
* **RAG Enhancement** - Automatically enhances prompts with relevant artistic context from a knowledge base
* **Multiple Image Sizes** - Support for various aspect ratios (Square, Landscape, Portrait, Wide)
* **Image Gallery** - View, download, and manage all your generated images

### RAG System

* **Knowledge Base** - 21 pre-seeded entries covering:

  * Art Styles (Oil Painting, Watercolor, Digital Art, Photorealistic, Impressionist)
  * Moods (Dramatic, Serene, Mysterious, Ethereal)
  * Subjects (Landscape, Portrait, Architecture, Nature, Abstract)
  * Lighting (Golden Hour, Studio, Neon, Moonlight)
  * Techniques (Bokeh, Long Exposure, Macro Photography)
* **Intelligent Context Retrieval** - Searches knowledge base for relevant context based on user prompts
* **LLM Enhancement** - Uses AI to enhance prompts with retrieved context for better results

### User Experience

* **Modern UI** - Clean, responsive design with smooth animations
* **Quick Templates** - Pre-built prompt templates for common image types
* **Real-time Feedback** - Loading states, progress indicators, and toast notifications
* **Mobile Friendly** - Fully responsive design for all screen sizes

## 🛠️ Tech Stack

* **Framework**: [Next.js 16](https://nextjs.org/) with App Router
* **Language**: [TypeScript 5](https://www.typescriptlang.org/)
* **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
* **Database**: [Prisma ORM](https://www.prisma.io/) with SQLite
* **Animations**: [Framer Motion](https://www.framer.com/motion/)
* **AI SDK**: z-ai-web-dev-sdk for LLM and Image Generation

## 📦 Installation

### Prerequisites

* Node.js 18+ or Bun
* npm, yarn, or bun package manager

### Clone the Repository

```bash
git clone https://github.com/Rishi46M/image-generator.git
cd image-generator
```

### Install Dependencies

```bash
# Using bun (recommended)
bun install

# Or using npm
npm install
```

### Environment Setup

Create a `.env` file in the root directory:

```env
DATABASE\\\\\\\_URL="file:./db/custom.db"
```

### Initialize Database

```bash
bun run db:push
```

### Start Development Server

```bash
bun run dev
```

The application will be available at `http://localhost:3000`

## 🚀 Usage

### Creating Images

1. **Enter a Prompt** - Describe the image you want to create

```
   Example: A serene mountain landscape at golden hour with dramatic clouds
   ```

2. **Select Image Size** - Choose from:

   * Square (1024×1024)
   * Landscape (1344×768)
   * Portrait (768×1344)
   * Wide (1440×720)
3. **Generate** - Click "Generate Image" and wait for the AI to create your image
4. **Download or Regenerate** - Save the image or try again with variations

### Using Templates

Click on any template in the "Quick Templates" section to quickly load a pre-built prompt structure.

### Managing Gallery

* View all generated images in the Gallery tab
* Click any image to view details
* Download or delete images as needed

## 📡 API Reference

### Image Generation

```
POST /api/generate
```

Generates an image with RAG enhancement.

**Request Body:**

```json
{
  "prompt": "string",
  "size": "1024x1024" | "1344x768" | "768x1344" | "1440x720"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "string",
    "originalPrompt": "string",
    "enhancedPrompt": "string",
    "imageData": "base64",
    "retrievedContext": \\\\\\\["string"],
    "size": "string",
    "createdAt": "date"
  }
}
```

### Get Images

```
GET /api/images?limit=20\\\\\\\&offset=0
```

Retrieves paginated list of generated images.

### Delete Image

```
DELETE /api/images?id={imageId}
```

Deletes a specific image.

### Knowledge Base

```
GET /api/knowledge
GET /api/knowledge?search={term}
GET /api/knowledge?category={category}
POST /api/knowledge
PUT /api/knowledge
DELETE /api/knowledge?id={id}
```

Manage knowledge base entries for RAG retrieval.

### Templates

```
GET /api/templates
POST /api/templates
PUT /api/templates
DELETE /api/templates?id={id}
```

Manage prompt templates.

### Seed Database

```
POST /api/seed
```

Initialize the knowledge base with default entries.

## 📁 Project Structure

```
├── prisma/
│   └── schema.prisma        # Database schema
├── public/                   # Static assets
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── generate/     # Image generation API
│   │   │   ├── images/       # Gallery management API
│   │   │   ├── knowledge/    # Knowledge base API
│   │   │   ├── seed/         # Database seeding API
│   │   │   └── templates/    # Templates API
│   │   ├── globals.css       # Global styles
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Main application
│   ├── components/ui/        # shadcn/ui components
│   ├── hooks/                # Custom React hooks
│   └── lib/
│       ├── db.ts             # Database client
│       └── utils.ts          # Utility functions
├── .env                       # Environment variables
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 🎨 Customization

### Adding Knowledge Base Entries

Add new entries via the API:

```javascript
await fetch('/api/knowledge', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    category: 'style',
    title: 'Cyberpunk',
    description: 'Futuristic neon-lit aesthetic',
    keywords: 'cyberpunk, neon, futuristic, sci-fi',
    promptHint: 'cyberpunk style, neon lights, futuristic aesthetic'
  })
});
```

### Adding Custom Templates

```javascript
await fetch('/api/templates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'My Template',
    description: 'Custom template description',
    template: 'A {style} of {subject} with {lighting}',
    category: 'custom',
    isFavorite: true
  })
});
```

## 📝 Scripts

```bash
# Development
bun run dev          # Start development server

# Database
bun run db:push      # Push schema changes to database
bun run db:generate  # Generate Prisma client
bun run db:migrate   # Run migrations
bun run db:reset     # Reset database

# Code Quality
bun run lint         # Run ESLint
bun run build        # Build for production
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

* [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
* [Framer Motion](https://www.framer.com/motion/) for smooth animations
* [Lucide Icons](https://lucide.dev/) for the icon set
* [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework

\---

Made with ❤️ using Next.js and AI

