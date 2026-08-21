/**
 * SITE — single source of truth for verified TL Mabuhay content and links.
 * Every fact here is taken directly from https://tlmabuhay.com (the
 * official site).
 */
export const SITE = {
  brand: {
    name: "TL Mabuhay",
    fullName: "TL Mabuhay Driving Lesson Academy, Inc.",
    tagline: "Your Defensive Driving Advocate",
    established: 2017,
  },
  stats: {
    branches: "147",
    branchesLabel: "branches",
    drivers: "160K+",
    driversLabel: "drivers trained",
    accreditation: "LTO",
    accreditationLabel: "accredited",
  },
  links: {
    home: "https://tlmabuhay.com",
    enroll: "https://tlmabuhay.com/enroll",
    enrollTheoretical:
      "https://tlmabuhay.com/enroll?course=theoretical-driving-course",
    enrollPractical:
      "https://tlmabuhay.com/enroll?course=practical-driving-course",
    branches: "https://tlmabuhay.com/#branches",
    rules: "https://tlmabuhay.com/enrollment-rules",
  },
  courses: {
    theoretical: {
      code: "TDC",
      name: "Theoretical Driving Course",
      duration: "15 hours",
      price: "From \u20b1800",
      description:
        "The required first step before practical training \u2014 driving rules, road signs, and safe practices.",
    },
    practical: {
      code: "PDC",
      name: "Practical Driving Course",
      duration: "Behind the wheel",
      price: "From \u20b11,800",
      description:
        "Hands-on training with a certified instructor, toward your driver's license.",
    },
  },
} as const;
