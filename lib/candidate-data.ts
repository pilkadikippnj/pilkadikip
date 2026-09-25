export interface Candidate {
  id: number;
  candidate_number: number;
  ketua_name: string;
  ketua_role: string;
  manager_name: string;
  manager_role: string;
  visi: string;
  misi: { title?: string; desc: string }[];
  photo_url: string;
}

export const CANDIDATES: Candidate[] = [
  {
    id: 1,
    candidate_number: 1,
    ketua_name: "Try Afandi",
    ketua_role: "Calon Ketua Umum KIP-Kuliah",
    manager_name: "Viola Saraswita",
    manager_role: "Campaign Manager",
    visi: "Menjadikan FORMADIKSI PNJ sebagai rumah pengembangan mahasiswa penerima KIP Kuliah yang berintegritas, progresif, dan berdaya saing sehingga mampu memberikan kontribusi nyata bagi kampus dan masyarakat.",
    misi: [
      {
        title: "OME",
        desc: "Membangun lingkungan dan budaya organisasi yang hangat, menyeluruh, dan merangkul seluruh mahasiswa KIP Kuliah PNJ dan pengurus FORMADIKSI.",
      },
      {
        title: "GROWTH",
        desc: "Menyediakan ruang pengembangan yang berkelanjutan untuk meningkatkan kompetensi, prestasi, dan potensi mahasiswa penerima KIP Kuliah PNJ.",
      },
      {
        title: "COLLABORATIONS",
        desc: "Membangun ruang kolaborasi terbuka untuk mempertemukan potensi dan gagasan demi kebermanfaatan yang lebih luas dan berdampak.",
      },
      {
        title: "IMPACT",
        desc: "Menghadirkan kebermanfaatan melalui program kerja yang inovatif, relevan, dan berkelanjutan bagi anggota, civitas akademika PNJ, serta masyarakat.",
      },
    ],
    photo_url: "/images/calon-1.jpeg",
  },
  {
    id: 2,
    candidate_number: 2,
    ketua_name: "Fatir Rifai",
    ketua_role: "Calon Ketua Umum KIP-Kuliah",
    manager_name: "Nayla Shofwanurrohmah",
    manager_role: "Campaign Manager",
    visi: "Menjadikan FORMADIKSI PNJ sebagai ruang bertumbuh yang inklusif, aspiratif, dan berdampak dalam mengembangkan potensi mahasiswa, memperjuangkan kesejahteraan, serta membangun sinergi strategis dengan kampus dan masyarakat.",
    misi: [
      { desc: "Memperkuat kekeluargaan dan solidaritas anggota." },
      { desc: "Mengembangkan potensi dan prestasi mahasiswa KIPK." },
      { desc: "Menyuarakan aspirasi dan kebutuhan mahasiswa KIPK." },
      { desc: "Membangun sinergi dengan pihak kampus." },
      { desc: "Meningkatkan kontribusi FORMADIKSI bagi masyarakat." },
      { desc: "Menciptakan organisasi yang profesional dan berkelanjutan." },
    ],
    photo_url: "/images/calon-2.jpeg",
  },
];
