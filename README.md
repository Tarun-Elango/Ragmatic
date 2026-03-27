# Ragmatic 

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


## Deployed on run


commands to uplaod image to artifact registry

gcloud builds submit --region=us-central1 --tag us-central1-docker.pkg.dev/jotdown-xxx/ragmatic-base/newimagename:tag
gcloud builds submit --region=us-central1 --tag us-central1-docker.pkg.dev/jotdown-xxx/ragmatic-base/ragmatic:latest
