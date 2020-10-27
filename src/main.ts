import * as core from "@actions/core";
import * as github from "@actions/github";

async function run() {
  try {
    const token = core.getInput("github-token", { required: true });

    const { pull_request: pr } = github.context.payload;
    if (!pr) {
      throw new Error("Event payload missing `pull_request`");
    }

    prContext =  {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: pr.number
    }
    
    const client = new github.GitHub(token);
    const filenames = client
       .paginate('GET /repos/:owner/:repo/pulls/:pull_number/files', prContext)
       .then((resp) => resp.data.map((file) => file.filename));
     for (const n of filenames) {
       if (n.startsWith(".github/workflows/")) {
         throw new Error("This PR attempts to change Actions configuration, bailing...")
       }
     }
    
    core.debug(`Creating approving review for pull request #${pr.number}`);
    await client.pulls.createReview({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: pr.number,
      event: "APPROVE"
    });
    core.debug(`Approved pull request #${pr.number}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
