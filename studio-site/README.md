## Studio Deploy Root

This folder is a standalone deploy root for `studio.mosion.app`.

Use it as a separate Vercel project while keeping the main website in the same Git repository.

### Recommended Vercel setup

1. Create a new Vercel project from this same GitHub repository.
2. Set the project's Root Directory to `studio-site`.
3. Keep the framework preset as `Other`.
4. Attach the custom domain `studio.mosion.app` to that new project.
5. Leave `mosion.app` and `www.mosion.app` attached to the main project.

### Why this works

Git still stores the entire repository, but each Vercel project only deploys the folder configured as its Root Directory.
