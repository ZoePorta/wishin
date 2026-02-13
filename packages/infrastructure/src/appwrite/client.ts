import { Client } from "appwrite";

/**
 * Initializes the Appwrite base client.
 *
 * @param endpoint - The Appwrite API endpoint.
 * @param projectId - The Appwrite project ID.
 * @returns An instance of the Appwrite Client.
 */
export const createAppwriteClient = (
  endpoint: string,
  projectId: string,
): Client => {
  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId);

  return client;
};
