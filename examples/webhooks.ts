/**
 * Webhook management example for the Orthanc Client SDK
 */

import { OrthancsClient } from "../src";

async function main() {
  const client = new OrthancsClient({
    endpoint: "https://api.orthanc.ai",
    apiKey: "your-api-key-here",
  });

  // Create a webhook
  const webhook = await client.createWebhook({
    url: "https://your-server.com/webhook",
    events: ["memory.created", "memory.updated", "memory.deleted"],
    secret: "your-hmac-secret",
    name: "Production Webhook",
  });

  console.log("Created webhook:", webhook.id);
  console.log("  URL:", webhook.url);
  console.log("  Events:", webhook.events.join(", "));
  console.log("  Enabled:", webhook.enabled);

  // List all webhooks
  const webhooks = await client.listWebhooks();

  console.log("\nAll webhooks:");
  for (const wh of webhooks) {
    console.log(`  ${wh.name || wh.id}: ${wh.url} (${wh.enabled ? "enabled" : "disabled"})`);
  }

  // Get a specific webhook
  const fetched = await client.getWebhook(webhook.id);

  console.log("\nFetched webhook:", fetched.name);

  // Update a webhook
  const updated = await client.updateWebhook(webhook.id, {
    events: ["memory.created"],
    enabled: false,
  });

  console.log("\nUpdated webhook:");
  console.log("  Events:", updated.events.join(", "));
  console.log("  Enabled:", updated.enabled);

  // Delete a webhook
  await client.deleteWebhook(webhook.id);

  console.log("\nWebhook deleted");
}

main().catch(console.error);
