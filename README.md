# NPST Blog

A simple blog built with Next.js, Prisma, shadcn/ui, and TailwindCSS, using Supabase as the database.

## Features

- ✅ User authentication (login/register)
- ✅ Create, edit, delete blog posts
- ✅ Markdown editor with live preview
- ✅ Syntax highlighting for code blocks
- ✅ Tag system for posts
- ✅ Featured posts support
- ✅ Responsive design
- ✅ Dark mode support
- ✅ Post management dashboard

## Tech Stack

- **Frontend**: Next.js 15 (App Router)
- **UI**: shadcn/ui + TailwindCSS
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Markdown**: @uiw/react-md-editor

## Getting Started

### Prerequisites

- Node.js 18+ (recommended 20+)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd npst-blog
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy the `.env` file and update it with your Supabase credentials:
   ```env
   DATABASE_URL="postgresql://postgres:<YOUR_PASSWORD>@db.xxxxxxxxxxxxxxx.supabase.co:5432/postgres"
   NEXTAUTH_SECRET="your-secret-key-here-change-this-in-production"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. Generate Prisma client:
```bash
npx prisma generate
```

5. Push database schema to Supabase:
```bash
npx prisma db push
```

6. Create the first admin user:
```bash
npm run seed:admin
```
This will create an admin user with:
- Email: `admin@example.com`
- Password: `admin123456`
- Role: ADMIN

7. Run the development server:
```bash
npm run dev
```

8. Open [http://localhost:3000](http://localhost:3000) in your browser.

9. Sign in with the admin credentials to access the admin dashboard.

## Usage

### Creating an Account

1. Navigate to `/auth/signin`
2. Click on "Sign up" (only if registration is enabled by admin)
3. Fill in your details to create an account

### Admin Features

Admins have full access to:
- **User Management**: View, activate/deactivate users, and manage user roles
- **Post Management**: View and edit all posts from all users
- **Settings**: Control whether new user registration is allowed
- **Admin Dashboard**: Accessible from `/admin` when logged in as admin

### Writing Posts

1. Sign in to your account
2. Navigate to the dashboard
3. Click "New Post"
4. Write your post using Markdown
5. Add tags, excerpt, and set as featured if desired
6. Save as draft or publish

### Managing Posts

From the dashboard, you can:
- View all your posts
- Edit existing posts
- Delete posts
- Toggle published/draft status
- Mark posts as featured

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard for managing posts
│   ├── posts/             # Individual post pages
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── editor/           # Markdown editor component
│   ├── providers/        # React providers
│   └── ui/               # shadcn/ui components
├── lib/                  # Utility functions
│   ├── auth.ts          # NextAuth configuration
│   └── prisma.ts        # Prisma client
└── styles/              # Global styles
```

## Database Schema

The application uses the following main models:

- **User**: Stores user information and authentication
- **Post**: Stores blog posts with metadata
- **Session**: Stores user sessions

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

Ensure your platform supports:
- Node.js runtime
- Environment variables
- Build command: `npm run build`
- Start command: `npm start`

## Environment Variables

- `DATABASE_URL`: Your Supabase PostgreSQL connection string
- `NEXTAUTH_SECRET`: A secret key for NextAuth.js
- `NEXTAUTH_URL`: The URL of your application

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues:
1. Check the [Issues](../../issues) page
2. Create a new issue with details
3. Include error messages and steps to reproduce