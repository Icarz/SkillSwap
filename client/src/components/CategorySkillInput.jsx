// src/components/CategorySkillInput.jsx
import { useEffect, useState } from "react";

const CategorySkillInput = ({
  skill,
  categories,
  onChange,
  onRemove,
}) => {
  const [localSkill, setLocalSkill] = useState(skill);

  useEffect(() => {
    onChange(localSkill);
  }, [localSkill]);

  return (
    <div className="flex gap-2 mb-2">
      <input
        type="text"
        value={localSkill.name}
        onChange={(e) => setLocalSkill({ ...localSkill, name: e.target.value })}
        placeholder="Skill name"
        className="flex-1 border rounded p-2"
      />
      <select
        value={localSkill.category}
        onChange={(e) =>
          setLocalSkill({ ...localSkill, category: e.target.value })
        }
        className="border rounded p-2"
      >
        <option value="">Select category</option>
        {categories.map((cat) => (
          <option key={cat._id} value={cat._id}>
            {cat.icon} {cat.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onRemove}
        className="bg-red-500 text-white px-3 rounded"
      >
        ×
      </button>
    </div>
  );
};

export default CategorySkillInput;
