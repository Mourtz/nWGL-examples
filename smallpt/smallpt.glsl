#version 300 es

precision highp float;

layout(location = 0) out vec4 FragColor;

uniform sampler2D u_backbuffer;

uniform float u_time;
uniform vec2 u_resolution;

#define MAXDEPTH 4

// Uncomment to see how many samples never reach a light source
//#define DEBUG

// Not used for now
#define DEPTH_RUSSIAN 2

#define PI 3.14159265359
#define DIFF 0
#define SPEC 1
#define REFR 2
#define NUM_SPHERES 9

float seed = 0.;
float rand() { return fract(sin(seed++)*43758.5453123); }

const struct Ray { vec3 o, d; };
const struct Sphere {
	float r;
	vec3 p, e, c;
	int refl;
};

const Sphere lightSourceVolume = Sphere(20., vec3(50., 81.6, 81.6), vec3(12.), vec3(0.), DIFF);

const Sphere spheres[NUM_SPHERES] = Sphere[](
  	Sphere(1e5, vec3(-1e5+1., 40.8, 81.6),	vec3(0.), vec3(.75, .25, .25), DIFF),
	Sphere(1e5, vec3( 1e5+99., 40.8, 81.6),vec3(0.), vec3(.25, .25, .75), DIFF),
	Sphere(1e5, vec3(50., 40.8, -1e5),		vec3(0.), vec3(.75), DIFF),
	Sphere(1e5, vec3(50., 40.8,  1e5+170.),vec3(0.), vec3(0.), DIFF),
	Sphere(1e5, vec3(50., -1e5, 81.6),		vec3(0.), vec3(.75), DIFF),
	Sphere(1e5, vec3(50.,  1e5+81.6, 81.6),vec3(0.), vec3(.75), DIFF),
	Sphere(16.5, vec3(27., 16.5, 47.), 	vec3(0.), vec3(1.), SPEC),
	Sphere(16.5, vec3(73., 16.5, 78.), 	vec3(0.), vec3(.7, 1., .9), REFR),
	Sphere(600., vec3(50., 681.33, 81.6),	vec3(12.), vec3(0.), DIFF)
);

float intersect(Sphere s, Ray r) {
	vec3 op = s.p - r.o;
	float t, epsilon = 1e-3, b = dot(op, r.d), det = b * b - dot(op, op) + s.r * s.r;
	if (det < 0.) return 0.; else det = sqrt(det);
	return (t = b - det) > epsilon ? t : ((t = b + det) > epsilon ? t : 0.);
}

int intersect(Ray r, out float t, out Sphere s, int avoid) {
	int id = -1;
	t = 1e5;
	s = spheres[0];
	for (int i = 0; i < NUM_SPHERES; ++i) {
		Sphere S = spheres[i];
		float d = intersect(S, r);
		if (i!=avoid && d!=0. && d<t) { t = d; id = i; s=S; }
	}
	return id;
}

vec3 jitter(vec3 d, float phi, float sina, float cosa) {
	vec3 w = normalize(d), u = normalize(cross(w.yzx, w)), v = cross(w, u);
	return (u*cos(phi) + v*sin(phi)) * sina + w * cosa;
}

vec3 radiance(Ray r) {
	vec3 acc = vec3(0.);
	vec3 mask = vec3(1.);
	int id = -1;
	for (int depth = 0; depth < MAXDEPTH; ++depth) {
		float t;
		Sphere obj;
		if ((id = intersect(r, t, obj, id)) < 0) break;
		vec3 x = t * r.d + r.o;
		vec3 n = normalize(x - obj.p), nl = n * sign(-dot(n, r.d));

		//vec3 f = obj.c;
		//float p = dot(f, vec3(1.2126, 0.7152, 0.0722));
		//if (depth > DEPTH_RUSSIAN || p == 0.) if (rand() < p) f /= p; else { acc += mask * obj.e * E; break; }

		if (obj.refl == DIFF) {
			float r2 = rand();
			vec3 d = jitter(nl, 2.*PI*rand(), sqrt(r2), sqrt(1. - r2));
			vec3 e = vec3(0.);
			//for (int i = 0; i < NUM_SPHERES; ++i)
			{
				// Sphere s = sphere(i);
				// if (dot(s.e, vec3(1.)) == 0.) continue;

				// Normally we would loop over the light sources and
				// cast rays toward them, but since there is only one
				// light source, that is mostly occluded, here goes
				// the ad hoc optimization:
				Sphere s = lightSourceVolume;
				int i = 8;

				vec3 l0 = s.p - x;
				float cos_a_max = sqrt(1. - clamp(s.r * s.r / dot(l0, l0), 0., 1.));
				float cosa = mix(cos_a_max, 1., rand());
				vec3 l = jitter(l0, 2.*PI*rand(), sqrt(1. - cosa*cosa), cosa);

				if (intersect(Ray(x, l), t, s, id) == i) {
					float omega = 2. * PI * (1. - cos_a_max);
					e += (s.e * clamp(dot(l, n),0.,1.) * omega) / PI;
				}
			}
			float E = 1.;//float(depth==0);
			acc += mask * obj.e * E + mask * obj.c * e;
			mask *= obj.c;
			r = Ray(x, d);
		} else if (obj.refl == SPEC) {
			acc += mask * obj.e;
			mask *= obj.c;
			r = Ray(x, reflect(r.d, n));
		} else {
			float a=dot(n,r.d), ddn=abs(a);
			float nc=1., nt=1.5, nnt=mix(nc/nt, nt/nc, float(a>0.));
			float cos2t=1.-nnt*nnt*(1.-ddn*ddn);
			r = Ray(x, reflect(r.d, n));
			if (cos2t>0.) {
				vec3 tdir = normalize(r.d*nnt + sign(a)*n*(ddn*nnt+sqrt(cos2t)));
				float R0=(nt-nc)*(nt-nc)/((nt+nc)*(nt+nc)),
					c = 1.-mix(ddn,dot(tdir, n),float(a>0.));
				float Re=R0+(1.-R0)*c*c*c*c*c,P=.25+.5*Re,RP=Re/P,TP=(1.-Re)/(1.-P);
				if (rand()<P) { mask *= RP; }
				else { mask *= obj.c*TP; r = Ray(x, tdir); }
			}
		}
	}
	return acc;
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
	seed = u_time + u_resolution.y * gl_FragCoord.x / u_resolution.x + gl_FragCoord.y / u_resolution.y;
	vec2 uv = 2. * gl_FragCoord.xy / u_resolution.xy - 1.;
	vec3 camPos = vec3((2. * .5*u_resolution.xy / u_resolution.xy - 1.) * vec2(48., 40.) + vec2(50., 40.8), 169.);
	vec3 cz = normalize(vec3(50., 40., 81.6) - camPos);
	vec3 cx = vec3(1., 0., 0.);
	vec3 cy = normalize(cross(cx, cz)); cx = cross(cz, cy);
    
    // Moving average (multipass code)
    vec3 col = texture(u_backbuffer, st).rgb + radiance(Ray(camPos, normalize(.53135 * (u_resolution.x/u_resolution.y*uv.x * cx + uv.y * cy) + cz)));
	FragColor = vec4(col, 1.);
}