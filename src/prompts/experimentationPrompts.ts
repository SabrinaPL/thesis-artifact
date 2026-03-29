// TODO: add prompts (complete IaC tasks / instructions, with increasing difficulty level)

export const PROMPT_FIRST_EXPERIMENT = `
    Task:

    Generate an Infrastructure-as-Code solution that provisions and configures a single web server on an OpenStack cloud platform.

    Requirements:

    Infrastructure (Terraform):

    Provision one virtual machine instance

    Configure a security group to allow:
    * Inbound SSH (port 22)
    * Inbound HTTP (port 80)

    Use variables for:
    * SSH key name
    * Path to private key (identity file)

    Configuration (Ansible):

    Install nginx using the system package manager

    Configure nginx to:
    * Run as a system service
    * Listen on port 80
    * Deploy a static HTML file at '/var/www/html/index.html'

    Constraints:

    * Do not hardcode credentials, SSH keys, or user-specific values
    * All configurable values must be defined as variables

    Output Format:

    * Terraform configuration files
    * Ansible playbook
    * Instructions to execute deployment and verify access via HTTP
`

export const PROMPT_SECOND_EXPERIMENT = `
    Task:

    Generate an Infrastructure-as-Code solution that provisions and configures two web servers on an OpenStack cloud platform.

    Requirements:

    Infrastructure (Terraform):
    
    Provision two virtual machine instances:
    * webserver1
    * webserver2

    Configure a security group to allow:
    * Inbound SSH (port 22)
    * Inbound HTTP (port 80)

    Generate a dynamic Ansible inventory file using Terraform outputs

    Configuration (Ansible):

    * Install nginx on both servers
    * Configure nginx to listen on port 80
    * Deploy distinct HTML content:
        - webserver1 must return content identifying itself as "webserver1"
        - webserver2 must return content identifying itself as "webserver2"

    Constraints:

    * Use Terraform variables and/or loops to avoid duplication
    * Do not hardcode credentials or sensitive data
    * Inventory must be generated dynamically from Terraform

    Output Format:

    * Terraform configuration files
    * Generated Ansible inventory approach
    * Ansible playbook
    * Instructions to deploy and verify both servers independently
`

export const PROMPT_THIRD_EXPERIMENT = `
    Task:

    Generate an Infrastructure-as-Code solution that provisions and configures a load-balanced web application on an OpenStack cloud platform.

    Requirements:

    Infrastructure (Terraform):

    Provision three virtual machines:
    * webserver1
    * webserver2
    * loadbalancer

    Configure security groups:

    * Web servers:
        - Allow inbound SSH (port 22)
        - Allow inbound HTTP (port 80) from internal network only
    
    * Load balancer:
        - Allow inbound SSH (port 22)
        - Allow inbound HTTP on port 8082 from external network

    Configuration (Ansible):

    Web servers:
    * Install nginx
    * Listen on port 80
    * Serve distinct HTML content identifying each server

    Load balancer:
    * Install nginx

    Configure nginx to:
    * Listen on port 8082
    * Define an upstream block with the two web servers (private IPs)
    * Use Round-Robin load balancing (default)
    * Proxy incoming requests to the upstream servers

    Constraints:
    * Port values (80 and 8082) must be defined once using variables and reused
    * Do not hardcode credentials or sensitive data
    * Web servers must not be directly accessible from external networks on port 80
    * Load balancer must not expose port 80

    Output Format:
    * Terraform configuration
    * Ansible playbooks
    * nginx configuration for load balancing
    * Instructions to deploy and verify load balancing behavior
`

export const PROMPT_FOURTH_EXPERIMENT = `
    Task:

    Generate an Infrastructure-as-Code solution that provisions a load-balanced web application with shared persistent storage and integrates Terraform execution into a CI/CD pipeline.

    Requirements:

    Infrastructure (Terraform):
    
    Provision:
    * Two web servers
    * One load balancer
    * One NFS server

    Configure networking and security groups:

    Web servers:
    * Allow SSH (22)
    * Allow HTTP (80) from internal network only

    Load balancer:
    * Allow SSH (22)
    * Allow HTTP (8082) from external network

    NFS server:
    * Allow SSH (22)
    * Allow NFS traffic from web servers
    * Provision a storage volume and attach it to the NFS server

    Configuration (Ansible):

    NFS server:
    * Install and configure NFS services
    * Mount the attached volume
    * Export a shared directory

    Web servers:
    * Install nginx
    * Mount the NFS shared directory
    * Serve web content from the mounted directory

    Load balancer:
    * Configure nginx:
    * Listen on port 8082
    * Use Round-Robin to forward requests to web servers

    CI/CD (GitLab CI):

    Provide a pipeline configuration file that:
    * Runs 'terraform init'
    * Runs 'terraform validate'
    * Runs 'terraform apply'
    * Configure Terraform to use a remote backend for state storage

    Constraints:
    * Do not hardcode credentials, secrets, or user-specific values
    * All configurable values must be defined using variables
    * Sensitive data must not be stored in the repository

    Output Format:
    * Terraform configuration (including volume resources)
    * Ansible playbooks (web servers, NFS server, load balancer)
    * GitLab CI pipeline configuration (.gitlab-ci.yml)
    * Explanation of:
        - Storage architecture (volume + NFS)
        - CI/CD workflow
        - Terraform state management approach
`
