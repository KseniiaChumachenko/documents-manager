FROM mcr.microsoft.com/devcontainers/javascript-node

# Install Pulumi CLI
RUN curl -fsSL https://get.pulumi.com | sh && \
    mv ~/.pulumi/bin/* /usr/local/bin/ && \
    rm -rf ~/.pulumi

# Install Cloudflare Wrangler CLI
RUN npm install -g wrangler

# Install Pulumi plugins (optional, can be lazy-loaded)
# RUN pulumi plugin install resource aws v6.0.0

# Set working directory
WORKDIR /workspace
