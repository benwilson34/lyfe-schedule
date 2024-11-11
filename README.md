# LyfeSchedule

_the todo app for people that get things done eventually™_

![Screenshots](./readme-img/screenshots.png "LyfeSchedule Screenshots")

## Key Features

📆 **Task Scheduling**: Easily schedule tasks for today, tomorrow, or a year from now.

🔜 **Date Ranges**: Many day-to-day tasks don't have a single, strict "due date" - give a task a date range and its priority will scale accordingly.

🔁 **Repeating Tasks**: Set up tasks to repeat every day, week, month, year, or somewhere in between.

⏱️ **Time Estimates**: Estimate how long your tasks will take so you can plan around them.

Be sure to read the [user-facing documentation](https://docs.lyfeschedule.com/) for more info.

This app can be run locally on any machine that supports Node and MongoDB, or it can be deployed remotely "on the cloud". If you just want to try it out, there is an invite-only instance running for beta testing purposes. Send us [an email](mailto:beta@lyfeschedule.com?subject=Request%20for%20beta%20access) to request access.

## Tech Stack

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

- TypeScript (statically-typed JavaScript)
- React (front-end framework)
- Tailwind CSS (style framework)
- Node.js and Express.js (web & dev server framework)
- MongoDB (data store)
- Webpack (build and bundling tools)
- Nodemailer, MJML, and Handlebars (email templating & sending)
- NextAuth.js (user authentication)
- Jest (automated testing)

## Run the App

### Installation

You'll need the following dependencies:

1. Node.js v20.18.0 or greater.
1. npm, yarn, or pnpm.
1. MongoDB connection string - either a local installation, or a remote instance, like on MongoDB Atlas for example.
   1. Create a database, recommended name `LyfeSchedule_beta` and initial collection `user`. Keep the defaults for all other options.
1. A SMTP email service.
   1. For a local instance or for testing, consider using a dummy SMTP server like [smtp4dev](https://github.com/rnwood/smtp4dev) or [maildev](https://github.com/maildev/maildev).
1. A clone of this repo.

Finally, install Node dependencies:

```bash
# from inside the project directory
npm install
# or
yarn install
# or
pnpm install
```

### Environment

See the [`.env.example`](./.env.example) for info on required and optional environment variables. Either create a `.env.local` file at the project root or define the variables another way.

TODO more info on configuration options here, like `IS_REGISTRATION_INVITE_ONLY`?

### Run the (production) server

Build and run the server:

```bash
npm run build && npm start
# or yarn or pnpm
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Create initial user account(s)

In order to set up the initial user, it's recommended to insert a dummy user and follow the password reset flow.

1. Using the MongoDB CLI or Compass, create the `user` collection if it doesn't exist. Then insert a record/document in the `user` collection like `{ "email": "<your-email>" }`; for example, `{ "email": "me@website.com" }`.
1. Get the ObjectID for that record/document and copy it into the `ADMIN_USER_ID` env var.
1. Restart the server.
1. Visit [/auth/request-reset-password](http://localhost:3000/auth/request-reset-password), type in your email from Step 1, and click "Send password reset email". Follow the instructions from the password reset email you receive.
1. Sign in with your email and newly set password.
1. If there are other users you want to invite, you can do so through the [/auth/send-invitation](http://localhost:3000/auth/send-invitation) page. They will get an invite email with further instructions on how to register.

Here's an alternate, more UI-centric approach:

1. Set the `IS_REGISTRATION_INVITE_ONLY` env var to `false`.
1. Restart the server.
1. Visit [/auth/register](http://localhost:3000/auth/register) and create as many users as needed.
1. _\[Recommended]_ Set the `IS_REGISTRATION_INVITE_ONLY` env var back to `true` to prevent further registrations. Only skip this step if you know what you're doing.
1. _\[Optional]_ Using the MongoDB CLI or Compass, check the `user` collection and get the ObjectID for the admin user (probably you). Copy this ID into the `ADMIN_USER_ID` env var.
1. If any env vars were changed, restart the server.

## Development

TODO contribution guide

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

### Installation and Environment

See the [Installation](#installation) and [Environment](#environment) sections above.

### Run the dev server

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. Pages will auto-update as you edit and save the files.

### Testing

This project uses Jest for automated testing. Run the tests:

```bash
npm test
# or
npm run test:watch
# or yarn or pnpm
```

### Create initial user account(s)

See the [Create initial user account(s)](#create-initial-user-accounts) section above.

### Suggested tools

- VS Code (TODO extensions?)
- ESLint
- MongoDB Compass
- Postman

## Feedback

Please let us know if you find a bug or have thoughts on what could be improved by sending an email to [feedback@lyfeschedule.com](mailto:feedback@lyfeschedule.com?subject=Feedback%20on%20LyfeSchedule).

## License

TODO, I haven't decided yet 😉
