import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Household, Result } from "@/domain/types";
import { createEmptyHousehold } from "@/domain/seed";
import { createDefaultStore } from "@/store/createDefaultStore";
import type { Store } from "@/store/store";

type Mutator = (household: Household) => Result<Household>;

interface HouseholdContextValue {
  household: Household;
  loading: boolean;
  dispatch: (mutator: Mutator) => Promise<Result<Household>>;
}

const HouseholdContext = createContext<HouseholdContextValue | null>(null);

interface HouseholdProviderProps {
  children: ReactNode;
  store?: Store;
}

export function HouseholdProvider({
  children,
  store: injectedStore,
}: HouseholdProviderProps) {
  const store = useMemo(() => injectedStore ?? createDefaultStore(), [injectedStore]);
  const [household, setHousehold] = useState<Household>(createEmptyHousehold());
  const [loading, setLoading] = useState(true);
  const writeChain = useRef(Promise.resolve());

  useEffect(() => {
    let active = true;

    void store.load().then((loaded) => {
      if (active) {
        setHousehold(loaded);
        setLoading(false);
      }
    });

    const unsubscribe = store.subscribe((next) => {
      setHousehold(next);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [store]);

  const dispatch = useCallback(
    (mutator: Mutator): Promise<Result<Household>> => {
      const run = async (): Promise<Result<Household>> => {
        const current = await store.load();
        const result = mutator(current);
        if (result.ok) {
          await store.save(result.value);
          setHousehold(result.value);
        }
        return result;
      };

      const next = writeChain.current.then(run, run);
      writeChain.current = next.then(
        () => undefined,
        () => undefined,
      );
      return next;
    },
    [store],
  );

  const value = useMemo(
    () => ({ household, loading, dispatch }),
    [household, loading, dispatch],
  );

  return (
    <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>
  );
}

export function useHousehold() {
  const context = useContext(HouseholdContext);
  if (!context) {
    throw new Error("useHousehold must be used within HouseholdProvider");
  }
  return context;
}
