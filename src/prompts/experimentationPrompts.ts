// TODO: add prompts (complete IaC tasks / instructions, with increasing difficulty level)

export const PROMPT_FIRST_EXPERIMENT = ``;

export const PROMPT_SECOND_EXPERIMENT = ``;

export const PROMPT_THIRD_EXPERIMENT = ``;

export const PROMPT_FOURTH_EXPERIMENT = ``;

/* Suggestion from Diego:
In the IaC that we created during the course, we created with OpenTofu/Terraform the elements related to the network, to security aspects, to instances, and created files for the configuration tool (the Ansible inventory). If you want to play the junior role, you can try other elements that we did not see during the IaC weeks. For example:
Using volumes for data persistence. 
To share the storage space of a volume in an organization, a good option is to configure an NFS server (in turn, the NFS machines use the Volumes) and connect the machines to that server for storage.
Put the execution of Terraform/OpenTofu inside the CI/CD pipeline, so it deploys and tests something in each change to the repository. In our IaC block, we executed ansible in the CI/CD, but Terraform was always executed in our local machine because there is something different to do to save the state files. It’s not super-difficult, but it is different from what you have seen, so you may act as a “junior” in that part. */