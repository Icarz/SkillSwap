const SkillCard = ({ skill, onClick }) => (
  <div
    className="group bg-white rounded-2xl shadow-md border-2 border-transparent hover:border-accent/40 hover:shadow-glow hover:-translate-y-1 transition-all duration-300 cursor-pointer p-5 flex flex-col items-center text-center"
    onClick={onClick}
  >
    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/20 flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform duration-300 shadow-sm">
      {skill.category?.icon}
    </div>
    <span className="font-bold text-primary capitalize text-sm leading-tight">
      {skill.name.replace(/-/g, " ")}
    </span>
    {skill.category?.description && (
      <span className="text-xs text-secondary/50 mt-1 line-clamp-2">
        {skill.category.description}
      </span>
    )}
  </div>
);

export default SkillCard;
