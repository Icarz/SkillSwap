const SkillCard = ({ skill, onClick }) => (
  <div
    className="bg-white rounded-xl shadow p-4 flex flex-col items-center border-2 border-transparent hover:border-accent transition cursor-pointer"
    onClick={onClick}
  >
    <span className="text-3xl mb-2">{skill.category?.icon}</span>
    <span className="font-bold text-primary capitalize">
      {skill.name.replace(/-/g, " ")}
    </span>
    <span className="text-xs text-secondary text-center mt-1">
      {skill.category?.description}
    </span>
  </div>
);

export default SkillCard;
