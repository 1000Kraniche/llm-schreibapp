<?php

namespace App\Entity;

use App\Repository\ProjectRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use App\Entity\TextDocument;
use App\Entity\Note;
use App\Entity\LLMInteraction;

#[ORM\Entity(repositoryClass: ProjectRepository::class)]
class Project
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $title = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\ManyToOne(inversedBy: 'projects')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Appuser $owner = null;

    /**
     * @var Collection<int, TextDocument>
     */
    #[ORM\OneToMany(targetEntity: TextDocument::class, mappedBy: 'project', orphanRemoval: true)]
    private Collection $textDocuments;

    /**
     * @var Collection<int, Note>
     */
    #[ORM\OneToMany(targetEntity: Note::class, mappedBy: 'project', orphanRemoval: true)]
    private Collection $notes;

    /**
     * @var Collection<int, LLMInteraction>
     */
    #[ORM\OneToMany(mappedBy: 'project', targetEntity: LLMInteraction::class, orphanRemoval: true)]
    private Collection $llmInteractions;

    public function __construct()
    {
        $this->textDocuments = new ArrayCollection();
        $this->notes = new ArrayCollection();
        $this->llmInteractions = new ArrayCollection();
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

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;
        return $this;
    }

    public function getOwner(): ?Appuser
    {
        return $this->owner;
    }

    public function setOwner(?Appuser $owner): static
    {
        $this->owner = $owner;
        return $this;
    }

    /**
     * @return Collection<int, TextDocument>
     */
    public function getTextDocuments(): Collection
    {
        return $this->textDocuments;
    }

    public function addTextDocument(TextDocument $textDocument): static
    {
        if (!$this->textDocuments->contains($textDocument)) {
            $this->textDocuments->add($textDocument);
            $textDocument->setProject($this);
        }

        return $this;
    }

    public function removeTextDocument(TextDocument $textDocument): static
    {
        if ($this->textDocuments->removeElement($textDocument)) {
            if ($textDocument->getProject() === $this) {
                $textDocument->setProject(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Note>
     */
    public function getNotes(): Collection
    {
        return $this->notes;
    }

    public function addNote(Note $note): static
    {
        if (!$this->notes->contains($note)) {
            $this->notes->add($note);
            $note->setProject($this);
        }

        return $this;
    }

    public function removeNote(Note $note): static
    {
        if ($this->notes->removeElement($note)) {
            if ($note->getProject() === $this) {
                $note->setProject(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, LLMInteraction>
     */
    public function getLlmInteractions(): Collection
    {
        return $this->llmInteractions;
    }

    public function addLlmInteraction(LLMInteraction $interaction): static
    {
        if (!$this->llmInteractions->contains($interaction)) {
            $this->llmInteractions->add($interaction);
            $interaction->setProject($this);
        }

        return $this;
    }

    public function removeLlmInteraction(LLMInteraction $interaction): static
    {
        if ($this->llmInteractions->removeElement($interaction)) {
            if ($interaction->getProject() === $this) {
                $interaction->setProject(null);
            }
        }

        return $this;
    }
}
