"use client";

import { useCallback, useRef, useState } from "react";

export interface Experiment {
  id: string;
  title: string;
  description: string;
  p5Code: string;
  parentId?: string;
  parentIds?: string[]; // For combined experiments with multiple parents
  version: number;
}

interface UseExperimentsReturn {
  experiments: Experiment[];
  activeExpId: string | null;
  pendingExpId: string | null;
  setActiveExpId: (id: string | null) => void;
  create: (args: {
    title?: string;
    description?: string;
    p5Code: string;
    parentId?: string;
  }) => string;
  evolve: (args: {
    title?: string;
    changesDescription?: string;
    description?: string;
    p5Code: string;
    parentId?: string;
  }) => string;
  combine: (args: {
    title?: string;
    description?: string;
    p5Code: string;
    parentIds: string[];
  }) => string;
  edit: (expId: string, p5Code: string) => void;
  confirmId: (tempId: string, realId: string) => void;
  findById: (id: string) => Experiment | undefined;
}

export function useExperiments(): UseExperimentsReturn {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [activeExpId, setActiveExpId] = useState<string | null>(null);
  const pendingExpRef = useRef<string | null>(null);

  const findById = useCallback(
    (id: string) => {
      return experiments.find((e) => e.id === id);
    },
    [experiments],
  );

  const create = useCallback(
    (args: {
      title?: string;
      description?: string;
      p5Code: string;
      parentId?: string;
    }) => {
      const tempId = `pending_${Date.now().toString(36)}`;
      pendingExpRef.current = tempId;
      setExperiments((prev) => [
        ...prev,
        {
          id: tempId,
          title: args.title || "Experiment",
          description: args.description || "",
          p5Code: args.p5Code,
          parentId: args.parentId,
          version: 1,
        },
      ]);
      setActiveExpId(tempId);
      return tempId;
    },
    [],
  );

  const evolve = useCallback(
    (args: {
      title?: string;
      changesDescription?: string;
      description?: string;
      p5Code: string;
      parentId?: string;
    }) => {
      const tempId = `pending_${Date.now().toString(36)}`;
      pendingExpRef.current = tempId;
      setExperiments((prev) => [
        ...prev,
        {
          id: tempId,
          title: args.title || "Evolved Experiment",
          description: args.changesDescription || args.description || "",
          p5Code: args.p5Code,
          parentId: args.parentId,
          version: 1,
        },
      ]);
      setActiveExpId(tempId);
      return tempId;
    },
    [],
  );

  const combine = useCallback(
    (args: {
      title?: string;
      description?: string;
      p5Code: string;
      parentIds: string[];
    }) => {
      const tempId = `pending_${Date.now().toString(36)}`;
      pendingExpRef.current = tempId;
      setExperiments((prev) => [
        ...prev,
        {
          id: tempId,
          title: args.title || "Combined Experiment",
          description: args.description || "",
          p5Code: args.p5Code,
          parentIds: args.parentIds,
          version: 1,
        },
      ]);
      setActiveExpId(tempId);
      return tempId;
    },
    [],
  );

  const edit = useCallback((expId: string, p5Code: string) => {
    setExperiments((prev) =>
      prev.map((exp) =>
        exp.id === expId ? { ...exp, p5Code, version: exp.version + 1 } : exp,
      ),
    );
    if (expId) {
      setActiveExpId(expId);
    }
  }, []);

  const confirmId = useCallback((tempId: string, realId: string) => {
    if (pendingExpRef.current === tempId) {
      pendingExpRef.current = null;
    }
    setExperiments((prev) =>
      prev.map((exp) => (exp.id === tempId ? { ...exp, id: realId } : exp)),
    );
    setActiveExpId((prev) => (prev === tempId ? realId : prev));
  }, []);

  return {
    experiments,
    activeExpId,
    pendingExpId: pendingExpRef.current,
    setActiveExpId,
    create,
    evolve,
    combine,
    edit,
    confirmId,
    findById,
  };
}
