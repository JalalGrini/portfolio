"use client";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
// A restrained image-displacement shader, not a synthetic replacement for artwork.
// Static art remains visible with reduced motion, data saving, WebGL failure, or context loss.
export default function FlowArtwork() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (
      reduced ||
      (navigator as Navigator & { connection?: { saveData?: boolean } })
        .connection?.saveData
    )
      return;
    const canvas = ref.current!;
    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      powerPreference: "low-power",
    });
    if (!gl) return;
    let disposed = false,
      visible = true,
      frame = 0,
      last = 0,
      started = 0;
    const vertex = `attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}`;
    const fragment = `precision mediump float;varying vec2 v;uniform sampler2D image;uniform float t;uniform float aspect;void main(){vec2 p=vec2(v.x,1.-v.y);float imageAspect=1.7916667;if(aspect<imageAspect)p.x=(p.x-.5)*aspect/imageAspect+.5;else p.y=(p.y-.5)*imageAspect/aspect+.5;p=(p-.5)*.97+.5;vec2 wave=vec2(sin(p.y*7.+t*.13)*cos(p.x*5.-t*.11),cos(p.x*6.+t*.09)*sin(p.y*5.-t*.08));p+=wave*.012;gl_FragColor=texture2D(image,p);}`;
    function shader(type: number, source: string) {
      const s = gl!.createShader(type);
      if (!s) return null;
      gl!.shaderSource(s, source);
      gl!.compileShader(s);
      if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
        gl!.deleteShader(s);
        return null;
      }
      return s;
    }
    const vs = shader(gl.VERTEX_SHADER, vertex),
      fs = shader(gl.FRAGMENT_SHADER, fragment);
    if (!vs || !fs) {
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
      return;
    }
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteProgram(program);
      return;
    }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const a = gl.getAttribLocation(program, "a");
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(gl.getUniformLocation(program, "image"), 0);
    const clock = gl.getUniformLocation(program, "t"),
      aspect = gl.getUniformLocation(program, "aspect");
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 1.25);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(aspect, canvas.width / Math.max(1, canvas.height));
    };
    const draw = (now: number) => {
      if (disposed) return;
      if (!started) started = now;
      if (
        visible &&
        document.visibilityState === "visible" &&
        now - last >= 33
      ) {
        last = now;
        gl.uniform1f(clock, (now - started) / 1000);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      frame = requestAnimationFrame(draw);
    };
    const image = new Image();
    image.onload = () => {
      if (disposed) return;
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image,
      );
      resize();
      gl.uniform1f(clock, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      setReady(true);
      frame = requestAnimationFrame(draw);
    };
    image.src = "/assets/studio/terrain.webp";
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const intersection = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
    });
    intersection.observe(canvas);
    const lost = (event: Event) => {
      event.preventDefault();
      setReady(false);
      cancelAnimationFrame(frame);
    };
    canvas.addEventListener("webglcontextlost", lost);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      image.onload = null;
      observer.disconnect();
      intersection.disconnect();
      canvas.removeEventListener("webglcontextlost", lost);
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [reduced]);
  return (
    <div
      className={`studio-flow ${ready && !reduced ? "studio-flow-ready" : ""}`}
    >
      <img
        className="studio-hero-art"
        src="/assets/studio/terrain.webp"
        alt=""
        fetchPriority="high"
      />
      <canvas ref={ref} className="studio-flow-canvas" aria-hidden="true" />
    </div>
  );
}
