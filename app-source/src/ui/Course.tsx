import { useEffect, useRef } from 'react';
import html from '../course/Lernseite.html?raw';
import { useStore } from '../store';
import { getPart } from '../data';

/** The Technical English course page, embedded in the app. It talks to the app via postMessage. */
export function CourseView() {
  const frame = useRef<HTMLIFrameElement>(null);
  const theme = useStore((s) => s.theme);
  const route = useStore((s) => s.courseRoute);

  const loaded = useRef(false);
  const post = (msg: unknown) => frame.current?.contentWindow?.postMessage(msg, '*');
  useEffect(() => { if (loaded.current) post({ type: 'theme', value: theme }); }, [theme]);
  // routes requested before the frame has loaded are applied in onLoad
  useEffect(() => { if (route && loaded.current) { post({ type: 'go', route }); useStore.getState().set({ courseRoute: null }); } }, [route]);

  return (
    <iframe
      ref={frame}
      title="Technical English course"
      srcDoc={html}
      className="h-full w-full border-0 bg-white dark:bg-slate-950"
      onLoad={() => {
        loaded.current = true;
        post({ type: 'theme', value: useStore.getState().theme });
        const r = useStore.getState().courseRoute;
        if (r) { post({ type: 'go', route: r }); useStore.getState().set({ courseRoute: null }); }
      }}
    />
  );
}

/** Global listener: course → app messages (works while the course tab is open). */
export function useCourseBridge() {
  useEffect(() => {
    const on = (e: MessageEvent) => {
      const d = e.data || {};
      if (d.type === 'course-progress') useStore.setState((s) => ({ courseTick: s.courseTick + 1 }));
      if (d.type === 'show3d' && getPart(d.id)) {
        const p = getPart(d.id)!;
        const s = useStore.getState();
        if (!p.modules.includes(s.moduleId)) s.setModule(p.modules[0]);
        s.set({ tab: 'explore' });
        setTimeout(() => { useStore.getState().select(p.id); useStore.setState((x) => ({ focusToken: x.focusToken + 1 })); }, 150);
      }
    };
    window.addEventListener('message', on);
    return () => window.removeEventListener('message', on);
  }, []);
}
