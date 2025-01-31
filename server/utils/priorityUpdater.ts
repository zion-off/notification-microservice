import { Provider } from "./types";

export default function priorityUpdater(
  listToUpdate: Provider[],
  newPriorities: Provider[]
) {
  listToUpdate = [...newPriorities];
}
