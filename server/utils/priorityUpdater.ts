import { Provider } from "./types";

export default function priorityUpdater(
  listToUpdate: Provider[],
  newPriorities: Provider[]
) {
  listToUpdate = [...newPriorities];
  console.log("######## UPDATED #######");
  for (const provider of listToUpdate) {
    console.log(provider.provider_name);
  }
}
