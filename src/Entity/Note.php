<?php

namespace App\Entity;

use App\Repository\NoteRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\DBAL\Types\Types;

#[ORM\Entity(repositoryClass: NoteRepository::class)]
class Note
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $title = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $content = null;

    // Basic Timestamps
    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $updatedAt = null;

    #[ORM\ManyToOne(inversedBy: 'notes')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Project $project = null;

    #[ORM\ManyToOne(targetEntity: self::class, inversedBy: 'childNotes')]
    private ?Note $parentNote = null;

    #[ORM\OneToMany(mappedBy: 'parentNote', targetEntity: self::class, cascade: ['persist', 'remove'])]
    private Collection $childNotes;

    public function __construct()
    {
        $this->childNotes = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(string $title): static
    {
        $this->title = $title;
        return $this;
    }

    public function getContent(): ?string
    {
        return $this->content;
    }

    public function setContent(?string $content): static
    {
        $this->content = $content;
        return $this;
    }

    public function getProject(): ?Project
    {
        return $this->project;
    }

    public function setProject(?Project $project): static
    {
        $this->project = $project;
        return $this;
    }

    public function getParentNote(): ?self
    {
        return $this->parentNote;
    }

    public function setParentNote(?self $parentNote): static
    {
        $this->parentNote = $parentNote;
        return $this;
    }

    public function getChildNotes(): Collection
    {
        return $this->childNotes;
    }

    public function addChildNote(self $childNote): static
    {
        if (!$this->childNotes->contains($childNote)) {
            $this->childNotes[] = $childNote;
            $childNote->setParentNote($this);
        }

        return $this;
    }

    public function removeChildNote(self $childNote): static
    {
        if ($this->childNotes->removeElement($childNote)) {
            if ($childNote->getParentNote() === $this) {
                $childNote->setParentNote(null);
            }
        }

        return $this;
    }

    // Basic Timestamp Getter/Setter
    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeInterface $createdAt): static
    {
        $this->createdAt = $createdAt;
        return $this;
    }

    public function getUpdatedAt(): ?\DateTimeInterface
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(\DateTimeInterface $updatedAt): static
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }
}